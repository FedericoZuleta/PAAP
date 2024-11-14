import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import bodyParser from 'body-parser';
import { getIdDepartamento, addProfesor, getProfesores, buscarProfesorPorCedula, eliminarProfesor, getMaterias, getAsesorias, getHorasDisponibles, asignarAsesoria, actualizarAsesoria, obtenerDepartamentoMateria, verificarConflictoHorario, getHorarioPorDepartamento, login} from './sqlServer.js';
import { Console } from 'console';
import {getConnection, mssql} from "./connectionSQLServer.js";
import { stringify } from 'querystring';
import multer from 'multer';
import fs from 'fs';

let cedula_actual = "";
let usuario_actual = "";

// Obtener el directorio actual usando ES6
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = 3000;

// para manejar los datos del formulario
app.use(bodyParser.urlencoded({ extended: true }));

// Servir archivos estáticos desde la carpeta 'public'
app.use(express.static(path.join(__dirname, 'public')));

//federico
// Servir archivos estáticos (archivos subidos)
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Ruta para acceder al JSON de materiales
app.get('/materiales.json', (req, res) => {
    fs.readFile('materiales.json', 'utf8', (err, data) => {
        if (err) {
            return res.status(500).json({ mensaje: 'Error al leer el archivo JSON.' });
        }
        res.json(JSON.parse(data));
    });
});
// Servir archivos estáticos desde la carpeta 'public'
app.use(express.static(path.join(__dirname, 'public')));
// Middleware
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static('public'));

// Verificar y crear la carpeta 'uploads' si no existe
const uploadDir = path.join(__dirname, 'uploads');
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir);
}

// Configuración de almacenamiento para multer
const storage = multer.diskStorage({
    destination: function (req, file, cb) {
      cb(null, 'uploads/');  // Carpeta donde se guardarán los archivos subidos
    },
    filename: function (req, file, cb) {
      // Guardar el archivo con su nombre original
      cb(null, file.originalname);
    }
  });
  const upload = multer({ storage: storage });
  
  // Middleware
  app.use(bodyParser.json());
  app.use(bodyParser.urlencoded({ extended: true }));
  
  // Ruta para manejar la subida de archivos
  app.post('/subir', upload.single('archivo'), (req, res) => {
    const { cedula, nombreProfesor, departamentoId, departamentoNombre, materiaId, materiaNombre, enlaceDrive } = req.body;
    const archivo = req.file;

    // Verificar que se haya recibido un archivo o un enlace
    if (!archivo && !enlaceDrive) {
        return res.status(400).json({ mensaje: "Se debe proporcionar un archivo o un enlace." });
    }

    // Crear un objeto con los datos para guardar en el archivo JSON
    const datos = {
        cedula,
        profesor: nombreProfesor,
        departamento: departamentoId,
        NombreDepartamento: departamentoNombre,
        materia: materiaId,
        NombreMateria: materiaNombre,
    };

    // Si hay archivo, agregar su información
    if (archivo) {
        datos.archivo = archivo.originalname;
        datos.ruta = path.join(__dirname, 'uploads', archivo.filename); // Ruta del archivo subido
    }

    // Si hay enlace, agregarlo
    if (enlaceDrive) {
        datos.enlaceDrive = enlaceDrive;
    }

    // Leer el archivo JSON existente y guardar los nuevos datos
    fs.readFile('materiales.json', 'utf8', (err, data) => {
        if (err) {
            return fs.writeFile('materiales.json', JSON.stringify([datos], null, 2), (err) => {
                if (err) {
                    return res.status(500).json({ mensaje: "Error al guardar los datos." });
                }
                res.status(200).json({ mensaje: "Archivo subido y datos guardados correctamente." });
            });
        }

        // Si el archivo JSON ya existe, agregar el nuevo objeto
        const materiales = JSON.parse(data);
        materiales.push(datos);

        // Escribir nuevamente el archivo con los nuevos datos
        fs.writeFile('materiales.json', JSON.stringify(materiales, null, 2), (err) => {
            if (err) {
                return res.status(500).json({ mensaje: "Error al guardar los datos." });
            }
            res.status(200).json({ mensaje: "Archivo subido y datos guardados correctamente." });
        });
    });
});

  
  // Función para obtener el nombre del profesor
  async function getProfesorData(cedula) {
    try {
      await mssql.connect(sqlConfig);
  
      const result = await mssql.query`
        SELECT u.Nombre
        FROM Usuario u
        WHERE u.Cedula = ${cedula}`;
  
      if (result.recordset.length > 0) {
        return { nombre: result.recordset[0].Nombre };
      }
  
      return null;  // Si no se encuentra el profesor
    } catch (error) {
      console.error('Error al obtener datos del profesor:', error);
      return null;
    }
  }
  // Rutas para obtener datos del profesor y departamentos
  app.get('/obtenerNombreYDepartamentos/:cedula', async (req, res) => {
    const cedula = req.params.cedula;
  
    try {
      // Conectar a la base de datos
      await mssql.connect(sqlConfig);
  
      // Consulta SQL para obtener el nombre del usuario y los departamentos asociados
      const result = await mssql.query`
        SELECT u.Nombre, d.IdDepartamento, d.Nombre AS Departamento
        FROM Usuario u
        JOIN Profesor_Materia pm ON u.Cedula = pm.Cedula
        JOIN Materias m ON pm.IdMateria = m.IdMateria
        JOIN Departamentos d ON m.IdDepartamento = d.IdDepartamento
        WHERE u.Cedula = ${cedula}`;
  
      if (result.recordset.length > 0) {
        const nombre = result.recordset[0].Nombre;
        const departamentos = result.recordset.map(row => ({
          IdDepartamento: row.IdDepartamento,
          Nombre: row.Departamento
        }));
  
        res.json({ nombre, departamentos });
      } else {
        res.status(404).json({ mensaje: 'Cédula no encontrada' });
      }
    } catch (error) {
      console.error('Error al obtener nombre y departamentos:', error);
      res.status(500).json({ mensaje: 'Error en la consulta a la base de datos' });
    }
  });
  app.get('/obtenerMateriasPorDepartamento/:idDepartamento', async (req, res) => {
    const idDepartamento = req.params.idDepartamento;

    try {
        // Conectar a la base de datos
        await mssql.connect(sqlConfig);

        // Consulta SQL para obtener las materias del departamento seleccionado
        const result = await mssql.query`
            SELECT m.IdMateria, m.Nombre AS Materia
            FROM Materias m
            WHERE m.IdDepartamento = ${idDepartamento}`;

        if (result.recordset.length > 0) {
            const materias = result.recordset.map(row => ({
                IdMateria: row.IdMateria,
                Nombre: row.Materia
            }));
            res.json({ materias });
        } else {
            res.status(404).json({ mensaje: 'No se encontraron materias para este departamento.' });
        }
    } catch (error) {
        console.error('Error al obtener las materias:', error);
        res.status(500).json({ mensaje: 'Error en la consulta a la base de datos' });
    }
});

// Ruta para manejar la carga de grabaciones o enlaces
app.post('/subir', (req, res) => {
    const { cedula, nombreProfesor, departamentoId, departamentoNombre, materiaId, materiaNombre, link } = req.body;

    // Verificar que todos los datos requeridos estén presentes
    if (!cedula || !nombreProfesor || !departamentoId || !departamentoNombre || !materiaId || !materiaNombre || !link) {
        return res.status(400).json({ mensaje: "Faltan datos requeridos." });
    }

    // Crear un objeto con los datos para guardar en el archivo JSON
    const datos = {
        cedula: cedula,
        profesor: nombreProfesor,  // Nombre del profesor dinámico
        departamento: departamentoId,
        NombreDepartamento: departamentoNombre,
        materia: materiaId,
        NombreMateria: materiaNombre,
        enlace: link,  // Guardar el enlace
    };

    // Leer el archivo links.json existente
    fs.readFile('links.json', 'utf8', (err, data) => {
        if (err) {
            // Si no existe el archivo, crear uno nuevo
            return fs.writeFile('links.json', JSON.stringify([datos], null, 2), (err) => {
                if (err) {
                    return res.status(500).json({ mensaje: "Error al guardar los datos." });
                }
                res.status(200).json({ mensaje: "Enlace guardado correctamente." });
            });
        }

        // Si el archivo links.json ya existe, agregar el nuevo objeto
        const links = JSON.parse(data);
        links.push(datos);

        // Escribir nuevamente el archivo con los nuevos datos
        fs.writeFile('links.json', JSON.stringify(links, null, 2), (err) => {
            if (err) {
                return res.status(500).json({ mensaje: "Error al guardar los datos." });
            }
            res.status(200).json({ mensaje: "Enlace guardado correctamente." });
        });
    });
});





  // Conexión a la base de datos y configuración
  const sqlConfig = {
    user: 'sa',
    password: '12345',
    database: 'PAAPV',
    server: 'localhost',
    options: {
      encrypt: false, // Cambiar a 'true' si usas Azure
      trustServerCertificate: true
    }
  };
  


//fin federico

//coso de juandavi
app.use(express.json());



app.post('/agregar-profesor', async (req, res) => {
    const { cedula, nombre, usuario, contrasena } = req.body;
    try {
        const result = await addProfesor(cedula, nombre, usuario, contrasena);
        res.status(200).json(result);
    } catch (error) {
        console.error("Error en /agregar-profesor:", error);
        res.status(500).json({ success: false, message: 'Error al procesar la solicitud', error: error.message });
    }
});

app.get('/get-horas-disponibles', async (req, res) => {
    const { dia } = req.query;
    try {
        const horas = await getHorasDisponibles(dia);
        res.status(200).json(horas);
    } catch (error) {
        console.error("Error en /get-horas-disponibles:", error);
        res.status(500).json({ success: false, message: 'Error al obtener las horas disponibles', error: error.message });
    }
});


app.post('/asignar-asesoria', async (req, res) => {
    const { IdMateria, cedula, horaIni, horaFin, dia } = req.body;
    try {
        const IdDepartamento = await obtenerDepartamentoMateria(IdMateria);
        const success = await asignarAsesoria(IdMateria, cedula, horaIni, horaFin, dia, IdDepartamento);
        res.json({ success });
    } catch (error) {
        console.error('Error asignando asesoría:', error);
        res.status(500).json({ success: false, message: 'Error al asignar asesoría' });
    }
});

app.get('/verificar-asesoria', async (req, res) => {
    const { cedula, horaIni, horaFin, dia, IdMateria } = req.query;
    try {
        const conflicto = await verificarConflictoHorario(cedula, horaIni, horaFin, dia, IdMateria);
        res.json({ hayConflicto: conflicto });
    } catch (error) {
        console.error('Error verificando conflicto:', error);
        res.status(500).json({ hayConflicto: false, message: 'Error al verificar conflicto' });
    }
});

app.get('/profesores', async (req, res) => {
    try {
        const profesores = await getProfesores();
        res.status(200).json(profesores);
    } catch (error) {
        console.error("Error al obtener los profesores:", error);
        res.status(500).json({ message: 'Error al obtener el listado de profesores' });
    }
});

app.get('/buscar-profesor', async (req, res) => {
    const { cedula } = req.query;
    try {
        const result = await buscarProfesorPorCedula(cedula);
        res.status(200).json(result);
    } catch (error) {
        console.error("Error en /buscar-profesor:", error);
        res.status(500).json({ message: 'Error al procesar la solicitud' });
    }
});

app.delete('/eliminar-profesor', async (req, res) => {
    const { cedula } = req.body;
    try {
        const result = await eliminarProfesor(cedula);
        res.status(200).json(result);
    } catch (error) {
        console.error("Error en /eliminar-profesor:", error);
        res.status(500).json({ message: 'Error al procesar la solicitud' });
    }
});

// Obtener materias
app.get('/get-materias', async (req, res) => {
    try {
        const materias = await getMaterias();
        res.status(200).json(materias);
    } catch (error) {
        console.error("Error en /get-materias:", error);
        res.status(500).json({ success: false, message: 'Error al obtener las materias', error: error.message });
    }
});

app.get('/get-asesorias', async (req, res) => {
    try {
        const asesorias = await getAsesorias();
        res.status(200).json(asesorias);
    } catch (error) {
        console.error("Error en /get-asesorias:", error);
        res.status(500).json({ success: false, message: 'Error al obtener las asesorías', error: error.message });
    }
});

app.post('/actualizar-asesoria', async (req, res) => {
    const { dia, IdMateria, horaIni, linkMeet, linkDocs } = req.body;

    try {
        const result = await actualizarAsesoria(dia, IdMateria, horaIni, linkMeet, linkDocs, cedula_actual);
        res.status(200).json(result);
    } catch (error) {
        console.error("Error en /actualizar-asesoria:", error);
        res.status(500).json({ success: false, message: 'Error al procesar la solicitud', error: error.message });
    }
});

app.get('/get-horario-por-departamento', async (req, res) => {
    const departamentoId = req.query.id;  // Obtiene el ID del departamento desde la URL

    if (!departamentoId) {
        return res.status(400).json({ success: false, message: 'ID de departamento no proporcionado' });
    }

    try {
        const horarios = await getHorarioPorDepartamento(departamentoId);  // Consulta el horario
        res.status(200).json(horarios); // Envía los datos en formato JSON
    } catch (error) {
        console.error("Error en /get-horario-por-departamento:", error);
        res.status(500).json({ success: false, message: 'Error al obtener los horarios', error: error.message });
    }
    
});

app.post('/login', async (req, res) => {
    try {
        let datos = await login(req);
        let { Usuario, TipoUsuario, cedula } = datos;

        // Asegurar que cedula y Usuario no estén indefinidos antes de asignar
        if (cedula && Usuario) {
            cedula_actual = cedula;
            usuario_actual = Usuario;

            console.log("Cédula asignada:", cedula_actual);
            console.log("Usuario asignado:", usuario_actual);
        }

        switch (TipoUsuario) {
            case 'Estudiante':
                return res.redirect('/SicauEstudiantes.html');
            case 'Profesor':
                return res.redirect('/S_Profesores.html');
            case 'Administrativo':
                return res.redirect('/P_Admin.html');
            default:
                console.log("No se pudo redirigir a ninguna página");
                return res.status(403).json({ success: false, message: "Tipo de usuario no válido" });
        }
    } catch (error) {
        console.error("Error en el login:", error);
        return res.status(401).json({ success: false, message: 'Usuario o contraseña incorrectos', error: error.message });
    }
});

app.get('/asesorias-disponibles', async (req, res) => {
    try {
        let cedula = cedula_actual
        const pool = await getConnection();
        const result = await pool.request()
            .input('cedula', cedula)
            .query(`SELECT A.IdAsesoria, COALESCE(M.Nombre, '') AS Materia, 
                           COALESCE(D.Nombre, '') AS Departamento, 
                           A.HoraIni, A.HoraFin, A.Dia, A.Estado 
                    FROM Asesorias AS A
                    LEFT JOIN Departamentos AS D ON A.IdDepartamento = D.IdDepartamento
                    LEFT JOIN Materias AS M ON A.IdMateria = M.IdMateria
                    WHERE A.Estado IS NULL OR A.Estado = 'Libre' OR A.Cedula = @cedula`);
        res.json(result.recordset);
    } catch (error) {
        console.error("Error al obtener asesorías disponibles:", error);
        res.status(500).json({ message: "Error en el servidor" });
    }
});

app.post('/reservar-asesoria', async (req, res) => {
    let { idAsesoria, cedula, idMateria, idDepartamento, horaInicio, horaFin, dia } = req.body;
    cedula = cedula_actual;

    try {
        // Obtén el IdDepartamento como número
        idDepartamento = await getIdDepartamento(idDepartamento);
        let idDepartamentoMateria = await obtenerDepartamentoMateria(idMateria);

        const pool = await getConnection();
        const result = await pool.request()
            .input('idAsesoria', mssql.Int, idAsesoria)
            .input('Cedula', cedula)
            .input('IdMateria', mssql.Int, idMateria)
            .input('IdDepartamento', mssql.Int, idDepartamentoMateria) // Usa el número directamente
            .input('HoraIni', horaInicio)
            .input('HoraFin', horaFin)
            .input('Dia', dia)
            .query(`UPDATE Asesorias
                    SET Estado = 'ocupado', Cedula = @Cedula, IdMateria = @IdMateria
                    WHERE Estado = 'Libre'
                    AND HoraIni = @HoraIni
                    AND HoraFin = @HoraFin
                    AND Dia = @Dia
                    AND IdDepartamento = @IdDepartamento`);

        if (result.rowsAffected[0] > 0) {
            res.json({ success: true, message: "Asesoría reservada con éxito" });
        } else {
            res.json({ success: false, message: "La asesoría ya fue reservada por otro profesor" });
        }

    } catch (error) {
        console.error("Error al reservar la asesoría:", error);
        res.status(500).json({ message: "Error en el servidor" });
    }
});

app.post('/liberar-asesoria', async (req, res) => {
    const { idAsesoria } = req.body;

    try {
        const pool = await getConnection();
        const result = await pool.request()
            .input('idAsesoria', mssql.Int, idAsesoria)
            .query(`
                UPDATE Asesorias
                SET Cedula = NULL, IdMateria = NULL, Estado = 'Libre'
                WHERE IdAsesoria = @idAsesoria
                AND Estado = 'ocupado'
            `);

        if (result.rowsAffected[0] > 0) {
            res.json({ success: true, message: "Asesoría liberada con éxito" });
        } else {
            res.json({ success: false, message: "La asesoría no se encuentra ocupada o no existe." });
        }
    } catch (error) {
        console.error("Error al liberar la asesoría:", error);
        res.status(500).json({ message: "Error en el servidor" });
    }
});




app.get('/get-cedula_actual', async (req, res) => {
    res.json({ cedula_actual });
});

// Rutas para los archivos HTML
app.get('/S_Estudiantes.html', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'S_Estudiantes.html'));
});

app.get('/S_Profesores.html', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'S_Profesores.html'));
});

app.get('/S_Admin.html', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'S_Admin.html'));
});

// Ruta para la página principal
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// Ruta para la página de inicio de sesión
app.get('/InicioSesion', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'InicioSesion.html'));
});

// Ruta para la validación del login
app.post('/login', (req, res) => {
    const { Usuario, Contraseña } = req.body;

    // Lógica de validación de credenciales
    if (Usuario === 'federico.avalos523' && Contraseña === '123456789') {
        res.redirect('/SicauEstudiantes.html');
    } else if (Usuario === 'jaime.guerra459' && Contraseña === '234567') {
        res.redirect('/S_Profesores.html');
    } else if (Usuario === 'Admin598' && Contraseña === '789456123') {
        res.redirect('/P_Admin.html');
    } else {
        res.send('Credenciales incorrectas. Intenta nuevamente.');
    }
});

// Escuchar el puerto
app.listen(PORT, () => {
    console.log(`Servidor escuchando en http://localhost:${PORT}`);
});
