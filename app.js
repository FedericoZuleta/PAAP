import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import bodyParser from 'body-parser';
import { addProfesor, getProfesores, buscarProfesorPorCedula, eliminarProfesor, getMaterias, getAsesorias, getHorasDisponibles, asignarAsesoria, actualizarAsesoria} from './sqlServer.js';


// Obtener el directorio actual usando ES6
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = 3000;

// Middleware para manejar los datos del formulario
app.use(bodyParser.urlencoded({ extended: true }));

// Servir archivos estáticos desde la carpeta 'public'
app.use(express.static(path.join(__dirname, 'public')));

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

// server.js o routes.js
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

// server.js o routes.js
app.post('/asignar-asesoria', async (req, res) => {
    const { cedula, idMateria, dia, horaIni } = req.body;
    try {
        const result = await asignarAsesoria(cedula, idMateria, dia, horaIni);
        res.status(200).json(result);
    } catch (error) {
        console.error("Error en /asignar-asesoria:", error);
        res.status(500).json({ success: false, message: 'Error al procesar la solicitud', error: error.message });
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
    const { dia, horaIni, linkMeet, linkDocs } = req.body;
    try {
        const result = await actualizarAsesoria(dia, horaIni, linkMeet, linkDocs);
        res.status(200).json(result);
    } catch (error) {
        console.error("Error en /actualizar-asesoria:", error);
        res.status(500).json({ success: false, message: 'Error al procesar la solicitud', error: error.message });
    }
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
    if (Usuario === 'federico.avalos523@pascualbravo.edu.co' && Contraseña === '123456789') {
        res.redirect('/SicauEstudiantes.html');
    } else if (Usuario === 'jaime.guerra459@pascualbravo.edu.co' && Contraseña === '234567') {
        res.redirect('/S_Profesores.html');
    } else if (Usuario === 'Admin598@pascualbravo.edu.co' && Contraseña === '789456123') {
        res.redirect('/P_Admin.html');
    } else {
        res.send('Credenciales incorrectas. Intenta nuevamente.');
    }
});

// Escuchar el puerto
app.listen(PORT, () => {
    console.log(`Servidor escuchando en http://localhost:${PORT}`);
});
