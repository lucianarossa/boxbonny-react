const User = require('../models/users');
const bcryptjs = require('bcryptjs');
const jwt = require('jsonwebtoken');
const sendVerification = require('./sendVerification');
const crypto = require('crypto');


const usersControllers = {
    registrarse: async (req,res) => {
        const { nombre, apellido,email, contraseña, imagen, from } = req.body.data; //utilizo "data" en la action de logueo
        try {
            const usuarioExiste = await Usuario.findOne({email});  //si el usuario existe
            const verification = false;
            const uniqueString = crypto.randomBytes(15).toString("hex"); 
            if(usuarioExiste) {
                if(usuarioExiste.from.indexOf(from) !== -1) { //si es true no le permitiremos volver a registrarse por este medio
                    res.json({
                        success: false,
                        from: from,
                        message: `${email} ya ha sido registrado, por favor inicia sesión`,
                    });
                } else { //sino significa que se registro por al menos 1 medio
                    const passwordhashed = bcryptjs.hashSync(contraseña, 10);
                    usuarioExiste.contraseña.push(passwordhashed); 
                    usuarioExiste.from.push(from);
                    usuarioExiste.verificarion = true; 
                    await usuarioExiste.save();
                    res.json({
                        success: true,
                        from:from,
                        message: `No te has registrado aún con esta cuenta, por favor registrate.`
                    });
                }
            } else { //si el usuario no existe
                const passwordhashed = bcryptjs.hashSync(contraseña, 10);
                const nuevoUsuario = await new Usuario ({ //creare uno con los requerimientos del modelo users
                    nombre,
                    apellido, 
                    email,
                    contraseña: [passwordhashed],
                    imagen,
                    from: [from],
                    uniqueString: uniqueString,
                    verification
                });
                if (from !== "formulario-registro"){
                    nuevoUsuario.verification = true;
                    await nuevoUsuario.save();
                    res.json({
                        success:true,
                        from:from,
                        message:`Ya te has logueado por ${from}, ahora puedes ingresar!`,
                    });
                   
                } else {
                    await nuevoUsuario.save();
                    await sendVerification(email, uniqueString);
                    res.json({
                        success:true,
                        from:from,
                        message: `Verifica el email ${email} para finalizar el registro`,
                    });
                }
            }
        } catch (error) {
            res.json({
                success: false,
                from:from,
                message: error,
            });
            console.log(error)
        }
    },
    inicioSesion : async (req,res) => {
        const { email, contraseña, from} = req.body.logueado;
        try{
            const usuarioExiste = await Usuario.findOne({ email });
            if(!usuarioExiste){
                res.json({
                    success: false,
                    from:"no from",
                    message: "El usuario no existe, por favor registrese"
                });
            } else if (usuarioExiste.verification){
                let passwordMatch = usuarioExiste.contraseña.filter((pass) => bcryptjs.compareSync(contraseña, pass));

                if (from === "formulario-inicio") {
                    if(passwordMatch.length > 0){
                        const usuarioData = {
                          id: usuarioExiste._id,
                          nombre: usuarioExiste.nombre,
                          apellido: usuarioExiste.apellido,
                          email: usuarioExiste.email,
                          contraseña:usuarioExiste.contraseña,
                          imagen: usuarioExiste.imagen,
                          from: usuarioExiste.from,
                        };
                        await usuarioExiste.save();
                        const token = jwt.sign({...usuarioData },
                        process.env.SECRET_KEY, {
                            expiresIn: 1000 * 60 * 60 * 24,
                        });
                        res.json({
                            response: {token, usuarioData },
                            success: true,
                            from:from,
                            message: "Bienvenido " + usuarioData.nombre + "!",
                        });
                    } else {
                        res.json({
                            success: false,
                            from:from,
                            message: `Verifica tu contraseña`,
                        });
                    }
                } else {
                    if(passwordMatch.length > 0) {
                        const usuarioData = {
                          id: usuarioExiste._id,
                          nombre: usuarioExiste.nombre,
                          apellido: usuarioExiste.apellido,
                          email: usuarioExiste.email,
                          contraseña:usuarioExiste.contraseña,
                          imagen: usuarioExiste.imagen,
                          from: usuarioExiste.from,
                        };
                        await usuarioExiste.save();
                        const token = jwt.sign({ ...usuarioData},
                            process.env.SECRET_KEY, {
                                expiresIn: 1000 * 60 * 60 * 24,
                            }
                            );
                            res.json({
                                response: { token, usuarioData },
                                success:true,
                                from:from,
                                message:"Bienvenido de vuelta" + usuarioData.nombre,
                            });
                    } else{
                        res.json({
                            success:false,
                            from:from,
                            message:"Aún no estás logueado con esta cuenta"
                        });
                    }
                }
            } else{
                res.json({
                    success:false,
                    from:from,
                    message:`Debes validar tu cuenta`,
                });
            }
        } catch(error){
            console.log(error);
            res.json({
                success:false,
                from:from,
                message:`Algo ha salido mal, por favor vuelve a intentarlo más tarde`
            });
        }
    },

    }



module.exports = usersControllers
