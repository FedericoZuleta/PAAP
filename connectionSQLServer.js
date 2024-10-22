import mssql from "mssql";

const connectionSettings = {
    server: "localhost",
    database: "PAAPV",
    user: "sa",
    password: "Jgiraldo2004",
    options: {
        trustedConnection: true, // Usa la conexión de Windows
        encrypt: true,
        trustServerCertificate: true
    }
};  

export async function getConnection() {
    try {
        return await mssql.connect(connectionSettings);
    } catch (error) {
        console.error(error);
    }
}

export { mssql };
