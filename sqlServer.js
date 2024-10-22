import { getConnection, mssql } from "./connectionSQLServer.js"; // Asegúrate de que la ruta sea correcta

const getDepartamentos = async () => {
    try {
        // Verificar si la conexión se realiza correctamente
        const pool = await getConnection();
        console.log("Conexión establecida correctamente");

        // Verificar si la consulta se ejecuta correctamente
        const result = await pool.request().query("SELECT * FROM Departamentos");

        // Verificar si el resultado tiene datos
        if (result.recordset.length > 0) {
            console.log("Datos obtenidos de la tabla facultades:", result.recordset);
        } else {
            console.log("No se encontraron datos en la tabla facultades");
        }

    } catch (error) {
        console.error("Error al obtener las facultades:", error);
    }
};



export const addProfesor = async (cedula, nombre, usuario, contrasena) => {
    try {
        const pool = await getConnection();
        console.log("Conexión establecida correctamente");

        console.log("Datos enviados:", { cedula, nombre, usuario, contrasena });

        const result = await pool.request()
            .input('cedula', mssql.VarChar(10), cedula)
            .input('nombre', mssql.NVarChar(50), nombre)
            .input('usuario', mssql.NVarChar(50), usuario)
            .input('contrasena', mssql.NVarChar(50), contrasena)
            .input('tipoUsuario', mssql.VarChar, 'Profesor')
            .query(`
                INSERT INTO Usuario (Cedula, Nombre, Usuario, Contraseña, TipoUsuario)
                VALUES (@cedula, @nombre, @usuario, @contrasena, @tipoUsuario)
            `);

        console.log("Profesor agregado correctamente:", result);
        return { success: true, message: 'Profesor agregado correctamente' };
    } catch (error) {
        console.error("Error al agregar el profesor:", error);
        return { success: false, message: 'Error al agregar el profesor', error: error.message };
    }
};

export const getProfesores = async () => {
    try {
        const pool = await getConnection();
        console.log("Conexión establecida correctamente para obtener profesores");

        const result = await pool.request()
            .query("SELECT Cedula, Nombre, Usuario FROM Usuario WHERE TipoUsuario = 'Profesor'");

        console.log("Profesores obtenidos:", result.recordset);
        return result.recordset;
    } catch (error) {
        console.error("Error al obtener los profesores:", error);
        throw error;
    }
};

export const buscarProfesorPorCedula = async (cedula) => {
    try {
        const pool = await getConnection();
        console.log("Conexión establecida correctamente");

        console.log("Cédula a buscar:", cedula);

        const result = await pool.request()
            .input('cedula', mssql.VarChar(10), cedula)
            .query(`
                SELECT Cedula, Nombre, Usuario, Contraseña, TipoUsuario
                FROM Usuario
                WHERE Cedula = @cedula
            `);

        // Verificar si se encontró el profesor
        if (result.recordset.length > 0) {
            console.log("Profesor encontrado:", result.recordset[0]);
            return { success: true, data: result.recordset[0] };
        } else {
            console.log("No se encontró ningún profesor con la cédula proporcionada.");
            return { success: false, message: 'No se encontró ningún profesor con la cédula proporcionada.' };
        }
    } catch (error) {
        console.error("Error al buscar el profesor:", error);
        return { success: false, message: 'Error al buscar el profesor', error: error.message };
    }
};

export const getAsesorias = async () => {
    try {
        const pool = await getConnection();
        console.log("Conexión establecida correctamente para obtener asesorías");

        const result = await pool.request()
            .query(`
                SELECT a.IdAsesoria, a.HoraIni, a.HoraFin, a.Dia, a.Link_Asesoria, a.Link_Material, 
                       u.Nombre AS NombreProfesor, m.Nombre AS NombreMateria
                FROM Asesorias a
                INNER JOIN Usuario u ON a.Cedula = u.Cedula
                INNER JOIN Materias m ON a.IdMateria = m.IdMateria
                WHERE LOWER(u.TipoUsuario) = 'profesor'
            `);

        console.log("Asesorías obtenidas:", result.recordset);
        return result.recordset;
    } catch (error) {
        console.error("Error al obtener las asesorías:", error);
        throw error;
    }
};


// Función para obtener las horas disponibles
export const getHorasDisponibles = async (dia) => {
    try {
        const pool = await getConnection();
        console.log("Conexión establecida correctamente para obtener horas disponibles");

        const result = await pool.request()
            .input('Dia', sql.VarChar, dia)
            .query(`
                SELECT HoraIni 
                FROM Asesorias 
                WHERE Dia = @Dia 
                  AND Estado = 'libre'
            `);

        console.log("Horas disponibles obtenidas:", result.recordset);
        return result.recordset;
    } catch (error) {
        console.error("Error al obtener las horas disponibles:", error);
        throw error;
    }
};


export const eliminarProfesor = async (cedula) => {
    try {
        const pool = await getConnection();
        console.log("Conexión establecida correctamente");

        const result = await pool.request()
            .input('cedula', mssql.VarChar(10), cedula)
            .query(`
                DELETE FROM Usuario
                WHERE Cedula = @cedula
            `);

        console.log("Profesor eliminado:", cedula);
        return { success: true, message: 'Profesor eliminado correctamente' };
    } catch (error) {
        console.error("Error al eliminar el profesor:", error);
        return { success: false, message: 'Error al eliminar el profesor', error: error.message };
    }
};

//ingresar el link de meet y de docs a la base de datos en la asesoría adecuada
export const actualizarAsesoria = async (dia, horaIni, linkMeet, linkDocs) => {
    try {
        const pool = await getConnection();
        console.log("Conexión establecida correctamente para actualizar la asesoría");

        const result = await pool.request()
            .input('Dia', dia)
            .input('HoraIni', horaIni)
            .input('Link_Asesoria', linkMeet)
            .input('Link_Material', linkDocs)
            .query(`
                UPDATE Asesorias 
                SET Link_Asesoria = @Link_Asesoria, Link_Material = @Link_Material
                WHERE Dia = @Dia AND HoraIni = @HoraIni
            `);

        if (result.rowsAffected[0] > 0) {
            console.log("Asesoría actualizada correctamente.");
            return { success: true, message: "Asesoría actualizada correctamente." };
        } else {
            console.log("No se encontró una asesoría con los criterios especificados.");
            return { success: false, message: "No se encontró una asesoría con los criterios especificados." };
        }
    } catch (error) {
        console.error("Error al actualizar la asesoría:", error);
        throw error;
    }
};

export const asignarAsesoria = async (cedula, idMateria, dia, horaIni) => {
    try {
        const pool = await getConnection();
        console.log("Conexión establecida correctamente para asignar asesoría");

        const result = await pool.request()
            .input('Cedula', cedula)
            .input('IdMateria', idMateria)
            .input('Dia', dia)
            .input('HoraIni', horaIni)
            .query(`
                UPDATE Asesorias
                SET Cedula = @Cedula, IdMateria = @IdMateria
                WHERE Dia = @Dia AND HoraIni = @HoraIni
            `);

        console.log("Asesoría actualizada:", result.rowsAffected);
        return { success: true, message: 'Asesoría actualizada correctamente' };
    } catch (error) {
        console.error("Error al asignar la asesoría:", error);
        return { success: false, message: error.message };
    }
};

export const getMaterias = async () => {
    try {
        const pool = await getConnection(); // Asegúrate de tener esta conexión configurada
        const result = await pool.request()
            .query(`SELECT IdMateria, Nombre FROM Materias`); // Ajusta la consulta según tu base de datos
        return result.recordset;
    } catch (error) {
        console.error("Error al obtener materias:", error);
        throw error;
    }
};
