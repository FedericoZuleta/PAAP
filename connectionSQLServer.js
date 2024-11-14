import mssql from "mssql";

const connectionSettings = {
    server: "localhost",
    database: "PAAPV",
    user: "sa",
    password: "12345",
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
