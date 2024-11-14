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

//crud administrador.--------------------------------------------------------------
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

export const getProfesores = async () => {//Listar todos los profesores
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

export const eliminarProfesor = async (cedula) => {//borrar profesor en base a su cedula
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

export const actualizarAsesoria = async (dia, IdMateria, horaIni, linkMeet, linkDocs, Cedula) => {
    try {

        console.log("Conexión establecida correctamente para actualizar la asesoría");

        let IdDepartamento = await obtenerDepartamentoMateria(IdMateria);  // corregir 'idMateria' por 'IdMateria'

        const pool = await getConnection();  // Obtener la conexión a la base de datos
        const result = await pool.request()
            .input('Dia', dia)
            .input('IdDepartamento', IdDepartamento)
            .input('HoraIni', horaIni)
            .input('Cedula', Cedula)
            .input('Link_Asesoria', linkMeet)
            .input('Link_Material', linkDocs)
            .query(`
                UPDATE Asesorias 
                SET Link_Asesoria = @Link_Asesoria, Link_Material = @Link_Material
                WHERE Dia = @Dia AND HoraIni = @HoraIni AND IdDepartamento = @IdDepartamento AND Cedula = @Cedula
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

//---------------------------------------------------------------------------------

//funciones reutilizable------------------------------------------------------------
export const buscarProfesorPorCedula = async (cedula) => {//funcion para buscar al profesor en base a su cedula
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

export async function getNombreProfesor(cedula) {/// Función para obtener el nombre del profesor en base a la cédula
    const query = `
        SELECT Nombre FROM Usuario WHERE Cedula = @cedula
    `;
    try {
        const pool = await getConnection();  // Obtener conexión a la base de datos

        const result = await pool.request()
            .input('cedula', mssql.VarChar, cedula)
            .query(query);

        await pool.close();

        return result.recordset[0]?.Nombre || "No asignado";
    } catch (error) {
        console.error("Error al obtener el nombre del profesor:", error);
        throw error;
    }
}

export const getNombreMateria = async (IdMateria) =>{
        const query = `
        SELECT Nombre FROM materias WHERE IdMateria = @IdMateria
    `;
    try {
        const pool = await getConnection();  // Obtener conexión a la base de datos

        const result = await pool.request()
            .input('IdMateria', mssql.Int, IdMateria)
            .query(query);

        await pool.close();

        return result.recordset[0]?.Nombre || "No asignado";
    } catch (error) {
        console.error("Error al obtener el nombre de la materia:", error);
        throw error;
    }
}

//---------------------------------------------------------------------------------

//Funciones para Asignar_asesoria.html---------------------------------------------
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

export const getHorasDisponibles = async (dia) => {// Función para obtener las horas disponibles
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

export async function asignarAsesoria(IdMateria, cedula, horaIni, horaFin, dia, departamento) {
    try {
        const pool = await getConnection();

        // Actualizar asesoría existente según el departamento, hora de inicio, hora de fin y día
        const query = `
            UPDATE Asesorias 
            SET Cedula = @cedula, 
                IdMateria = @idMateria 
            WHERE Dia = @dia 
                AND HoraIni = @horaIni 
                AND HoraFin = @horaFin 
                AND IdDepartamento = @IdDepartamento
        `;

        await pool.request()
            .input('idMateria', mssql.Int, IdMateria)
            .input('cedula', mssql.VarChar, cedula)
            .input('horaIni', mssql.VarChar, horaIni)
            .input('horaFin', mssql.VarChar, horaFin)
            .input('dia', mssql.VarChar, dia)
            .input('IdDepartamento', mssql.Int, departamento)
            .query(query);

        await pool.close();
        return true;
    } catch (error) {
        console.error('Error al asignar asesoría:', error);
        throw error;
    }
}

export async function borrarAsesoria(params) {
    try {
        const pool = await getConnection();
        // Actualizar asesoría existente según el departamento, hora de inicio, hora de fin y día
        const query = `
            Delete Asesorias 
            Where Cedula = @cedula AND
                IdMateria = @idMateria 
                 Dia = @dia 
                AND HoraIni = @horaIni 
                AND HoraFin = @horaFin 
                AND IdDepartamento = @IdDepartamento
        `;

        await pool.request()
            .input('idMateria', mssql.Int, IdMateria)
            .input('cedula', mssql.VarChar, cedula)
            .input('horaIni', mssql.VarChar, horaIni)
            .input('horaFin', mssql.VarChar, horaFin)
            .input('dia', mssql.VarChar, dia)
            .input('IdDepartamento', mssql.Int, departamento)
            .query(query);

        await pool.close();
        return true;
    } catch (error) {
        console.error('Error al asignar asesoría:', error);
        throw error;
    }
}

export async function verificarConflictoHorario(cedula, horaIni, horaFin, dia, IdMateria) {
    const IdDepartamento = await obtenerDepartamentoMateria(parseInt(IdMateria));
    try {
        const pool = await getConnection();

        const query = `
            SELECT COUNT(*) AS conflicto
            FROM Asesorias
            WHERE Cedula = @cedula 
            AND Dia = @dia
            AND IdDepartamento = @IdDepartamento
            AND (
            CAST(HoraIni AS TIME) < CAST(@horaFin AS TIME) 
            AND CAST(HoraFin AS TIME) > CAST(@horaIni AS TIME) );
        `;

        const result = await pool.request()
            .input('cedula', mssql.VarChar, cedula)
            .input('horaIni', mssql.VarChar, horaIni)
            .input('horaFin', mssql.VarChar, horaFin)
            .input('dia', mssql.VarChar, dia)
            .input('IdDepartamento', mssql.Int, IdDepartamento)
            .query(query);

        await pool.close();
        return result.recordset[0].conflicto > 0;
    } catch (error) {
        console.error('Error al verificar conflicto:', error);
        throw error;
    }
}

export const getMaterias = async () => {
    try {
        const pool = await getConnection(); // Asegúrate de tener esta conexión configurada
        const result = await pool.request()
            .query(`SELECT m.IdMateria, m.Nombre, d.Nombre AS Departamento
        FROM Materias m
        JOIN Departamentos d ON m.IdDepartamento = d.IdDepartamento;`); // Ajusta la consulta según tu base de datos
        return result.recordset;
    } catch (error) {
        console.error("Error al obtener materias:", error);
        throw error;
    }
};
export async function getHorarioPorDepartamento(departamentoId) {
    const query = `
    SELECT 
        a.Cedula, 
        a.HoraIni, 
        a.Dia, 
        a.Link_Asesoria, 
        a.Link_Material, 
        m.Nombre AS Materia
    FROM Asesorias a
    LEFT JOIN materias m ON a.IdMateria = m.IdMateria
    WHERE a.IdDepartamento = @departamentoId  -- Usamos el parámetro correctamente aquí
    ORDER BY a.Dia, a.HoraIni;
    `;
    try {
        const pool = await getConnection();  // Obtener conexión a la base de datos

        // Realizar la consulta pasando el parámetro departamentoId
        const result = await pool.request()
            .input('departamentoId', mssql.Int, departamentoId)  // Asegúrate de pasar el parámetro
            .query(query);

        const horarios = []; // Lista de horarios que vamos a enviar al frontend

        for (const row of result.recordset) {
            // Obtener el nombre del profesor (esto puede ser optimizado)
            const nombreProfesor = await getNombreProfesor(row.Cedula);
            row.Profesor = nombreProfesor;  // Asignar el nombre al campo Profesor
            if(row.Materia==null){
                row.Materia = "No asignado"
            }
            horarios.push(row);  // Añadir cada asesoría al array
        }

        return horarios;
    } catch (error) {
        console.error("Error al obtener los horarios del departamento:", error);
        throw error;
    }
}

export async function obtenerDepartamentoMateria(IdMateria) {
    try {
        const pool = await getConnection();
        const query = `SELECT IdDepartamento FROM materias WHERE IdMateria = @IdMateria`;
        const result = await pool.request()
            .input('IdMateria', mssql.Int, parseInt(IdMateria))
            .query(query);
        await pool.close();
        return result.recordset[0].IdDepartamento;
    } catch (error) {
        console.error('Error obteniendo departamento de la materia:', error);
        throw error;
    }
}

export async function buscarDocumento(departamento, horaIni){
    try {
        const pool = await getConnection();
        const query = `SELECT Link_Material FROM Asesorias WHERE IdDepartamento = @IdMateria AND HoraIni = @HoraIni`;
        const result = await pool.request()
            .input('IdMateria', mssql.Int, IdMateria)
            .input('HoraIni', mssql.VarChar, HoraIni)
            .query(query);
        await pool.close();
        return parseInt(result.recordset[0].Link_Material);
    } catch (error) {
        console.error('Error al buscar el material de esto: ', error);
        throw error;
    }
}

export const login = async (req) => {
    const { Usuario, Contraseña } = req.body;
    try {
        const pool = await getConnection();
        const result = await pool.request()
            .input('Usuario', Usuario)
            .input('Contraseña', Contraseña)
            .query(`SELECT TipoUsuario, Cedula FROM Usuario WHERE Usuario = @Usuario AND Contraseña = @Contraseña`);
        
        if (result.recordset.length > 0) {
            const { TipoUsuario, Cedula } = result.recordset[0];
            console.log("TipoUsuario encontrado:", TipoUsuario);
            console.log("Cédula encontrada:", Cedula);
            return { Usuario, TipoUsuario, cedula: Cedula }; // Incluye la cédula directamente en el objeto devuelto
        } else {
            throw new Error('Usuario no encontrado o contraseña incorrecta');
        }
    } catch (error) {
        console.error("Error en login:", error);
        throw error; // Lanzar error para manejarlo en app.js
    }
};
export const getIdDepartamento = async (departamento) => {
    try {
        const pool = await getConnection();
        const result = await pool.request()
            .input('departamento', departamento)
            .query(`SELECT IdDepartamento FROM Departamentos WHERE Nombre = @departamento`);
        
        if (result.recordset.length > 0) {
            return result.recordset[0].IdDepartamento; // Solo devuelve el valor de IdDepartamento
        } else {
            throw new Error('Departamento no encontrado');
        }
    } catch (error) {
        console.error("Error en departamento:", error);
        throw error; // Lanzar error para manejarlo en app.js
    }
};

export const confirmarDepartamentoAsesoriaMateria = async (idMateria, idDepartamentoAsesoria) => {
    try {
        const idDepartamentoMateria = await obtenerDepartamentoMateria(idMateria)
        const pool = await getConnection();
        const result = await pool.request()
            .input('idM', idDepartamentoMateria)
            .query(`SELECT IdDepartamento FROM Departamentos WHERE Nombre = @departamento`);
        
        if (result.recordset.length > 0) {
            return result.recordset[0].IdDepartamento; // Solo devuelve el valor de IdDepartamento
        } else {
            throw new Error('Departamento no encontrado');
        }
    } catch (error) {
        console.error("Error en departamento:", error);
        throw error; // Lanzar error para manejarlo en app.js
    }
};

export const liberarAsesoria = async (idAsesoria) => {
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
        
        return result.rowsAffected[0] > 0;
    } catch (error) {
        console.error("Error al liberar asesoría en SQL Server:", error);
        throw error;
    }
};


export const getLink = async (IdAsesoria) =>{
    try{
        const pool = await getConnection();
        const query = `SELECT Link_Material FROM Asesorias WHERE  IdAsesoria= @IdAsesoria`;
        const result = await pool.request()
            .input('IdAsesoria', mssql.Int, IdMateria)
            .query(query);
        await pool.close();
        return parseInt(result.recordset[0].IdDepartamento);
    }catch(error){
        console.error('Error obteniendo el link de el documento docs:', error);
        throw error;
    }
}
