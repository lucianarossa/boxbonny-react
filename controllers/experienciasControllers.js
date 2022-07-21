const Pack = require('../models/pack')
const Experiencia = require('../models/experiencia')
const crypto = require('crypto');

const experienciasControllers = {
	getExperiencias: async (req, res) => {
		let experiencias
		let error = null
		try {
			experiencias = await Experiencia.find()
		} catch (err) {
			error = err
			console.error(error)
		}
		res.json({
			response: error ? 'ERROR' : { experiencias },
			success: error ? false : true,
			error: error
		})
	},

	getOneExperiencia: async (req, res) => {
		const id = req.params.id
		let experiencia
		let error = null
		try {
			experiencia = await Experiencia.findOne({ _id: id })
		} catch (err) {
			error = err
			console.error(error)
		}
		res.json({
			response: error ? 'ERROR' : experiencia,
			success: error ? false : true,
			error: error
		})

	},

	addExperiencia: async (req, res) => {
		const { nombre, descripcion, incluye, direccion, ciudad, pack } = req.body.data
		const { file } = req.files
		let experiencia
		let error = null
		try {
			const experienciaExiste = await Experiencia.findOne({ nombre })
			if (experienciaExiste) {
				res.json({
					success: false,
					Message: "la experiencia que intentas agregar, ya ha sido cargada previamente"
				})
			} else {
				const filename = crypto.randomBytes(10).toString('hex') + "." + file.name.split(".")[file.name.split(".").length - 1]
				const ruta = `${__dirname}../storage/experiencias/${filename}`
				file.mv(ruta, err => {
					if (err) {
						console.log(err)
					} else {
						console.log("archivo cargado")
					}
				})
				experiencia = await new Experiencia({
					nombre: nombre,
					descripcion: descripcion,
					incluye: incluye,
					direccion: direccion,
					ciudad: ciudad,
					imagen: "https://boxbonny-back.herokuapp.com/storage/experiencias/" + filename,
					pack: pack
				}).save()
				nuevaExperiencia = await Pack.findOneAndUpdate({ _id: pack }, { $push: { experiencias: experiencia._id } }, { new: true })
				res.json({
					success: true,
					Message: "la experiencia se añadio exitosamente"
				})
			}
		} catch (err) {
			error = err
			res.json({
				success: false,
				Message: error
			})
		}
	},
	modifyExperiencia: async (req, res) => {
		const id = req.params.id
		const experiencia = req.body.data
		let experienciadb
		let error = null
		try {
			experienciadb = await Experiencia.findOneAndUpdate({ _id: id }, experiencia, { new: true })
		} catch (err) { error = err }
		res.json({
			response: error ? 'ERROR' : experienciadb,
			success: error ? false : true,
			error: error
		})
	},
	removeExperiencia: async (req, res) => {
		const id = req.params.id
		let experiencia
		let error = null
		try {
			experiencia = await Experiencia.findOneAndDelete({ _id: id })
			quitarExperiencia = await Pack.findOneAndUpdate({ _id: experiencia.pack }, { $pull: { experiencias: experiencia._id } }, { new: true })

		} catch (err) { error = err }
		res.json({
			response: error ? 'ERROR' : experiencia,
			success: error ? false : true,
			error: error
		})

	},

	likeDislike: async (req, res) => {
		const id = req.params.id
		const usuario = req.usuario.id //por respuesta de passport

		await Experiencia.findOne({ _id: id })
			.then((experiencia) => {
				if (experiencia.likes.includes(usuario)) {
					Experiencia.findOneAndUpdate({ _id: id }, { $pull: { likes: usuario } }, { new: true })
						.then((response) =>
							res.json({
								success: true,
								response: response.likes,
								message: "Dislike"
							}))
						.catch((error) => console.log(error))
				} else {
					Experiencia.findOneAndUpdate({ _id: id }, { $push: { likes: usuario } }, { new: true })
						.then((response) =>
							res.json({
								success: true,
								response: response.likes,
								message: "Gracias por tu like!"
							}))
						.catch((error) => console.log(error))
				}
			})
			.catch((error) =>
				res.json({
					success: false,
					response: error,
					message: "Algo salió mal, por favor intenta de nuevo más tarde"
				}))

	},

}




module.exports = experienciasControllers