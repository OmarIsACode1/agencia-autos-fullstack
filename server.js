// Importamos librerías necesarias
const express = require('express');
const mysql = require('mysql2');
const dotenv = require('dotenv');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const cors = require('cors');

// Cargamos las variables de entorno desde el archivo .env
dotenv.config();

// Inicializamos la aplicación de Express
const app = express();

// Middlewares globales
app.use(express.json()); // Permite recibir datos en formato JSON en las peticiones
app.use(cors()); // Permite peticiones desde el frontend

// Configuración de la conexión a la base de datos MySQL
const db = mysql.createConnection({
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME
});

// Conectar a la base de datos
db.connect((err) => {
    if (err) {
        console.error('Error al conectar a la base de datos MySQL:', err);
        return;
    }
    console.log('¡Conectado exitosamente a la base de datos MySQL de la agencia!');
});

// ------- RUTA DE PRUEBA:
app.get('/', (req, res) => {
    res.json({ mensaje: 'Bienvenido al API REST de la agencia de autos SimplyAwesome'});
});

// Ruta para iniciar sesión (con manejo de errores protegido para que no se caiga el servidor)
app.post('/api/login', (req, res) => {
    const {email, password} = req.body;

    const query = 'SELECT * FROM usuarios WHERE email = ?';
    db.query(query, [email], async (err, resultados) => {
        try {
            if (err) {
                return res.status(500).json({ error: 'Error en la base de datos.' });
            }
            if (!resultados || resultados.length === 0) {
                return res.status(401).json({ error: 'Credenciales inválidas (usuario no encontrado).' });
            }

            const usuario = resultados[0];

            // Verificar la contraseña cifrada
            const esValida = await bcrypt.compare(password, usuario.password);
            if (!esValida) {
                return res.status(401).json({ error: 'Credenciales inválidas (contraseña incorrecta).' });
            }

            // Validar que exista la clave secreta
            if (!process.env.JWT_SECRET) {
                return res.status(500).json({ error: 'Falta configurar JWT_SECRET en el archivo .env' });
            }

            // Generar el token JWT que expira en 1 hora
            const token = jwt.sign({ id: usuario.id, email: usuario.email }, process.env.JWT_SECRET, { expiresIn: '1h' });

            res.json({ mensaje: 'Login exitoso', token });
        } catch (error) {
            console.error('Error en el servidor:', error);
            res.status(500).json({ error: 'Error interno en el servidor.' });
        }
    });
});

// 1. Autenticación (Registro y Login con JWT)
// Ruta para registrar un nuevo usuario (cifra la contraseña con bcryptjs)
app.post('/api/registro', async (req, res) => {
    const { email, password } = req.body;
    
    try {
        // Encriptar la contraseña antes de guardarla
        const salt = await bcrypt.genSalt(10);
        const passwordHash = await bcrypt.hash(password, salt);

        const query = 'INSERT INTO usuarios (email, password) VALUES (?, ?)';
        db.query(query, [email, passwordHash], (err, resultado) => {
            if (err) {
                return res.status(500).json({ error: 'El usuario ya existe o hubo un error en el registro.' });
            }
            res.json({ mensaje: '¡Usuario registrado con éxito!' });
        });
    } catch (error) {
        res.status(500).json({ error: 'Error en el servidor al procesar el registro.' });
    }
});

// Middleware de autenticación para proteger rutas CRUD
const verificarToken = (req, res, next) => {
    const authHeader = req.headers['authorization'];
    if(!authHeader) {
        return res.status(403).json({error:'Token no proporcionado. Acceso denegado.'});
    }

    const token = authHeader.split(' ')[1]; // Formato: Bearer TOKEN
    jwt.verify(token, process.env.JWT_SECRET, (err, decoded) => {
        if(err) {
            return res.status(401).json({ error: 'Token inválido o expirado.'});
        }
        req.usuario = decoded; // Guardamos los datos del usuario decodificados 
        next(); // Permitimos continuar con la petición
    });
};

// 2. Operaciones CRUD para vehículos
// READ. Obtener todos los vehículos (Operación pública)
app.get('/api/vehiculos', (req, res) => {
    db.query('SELECT * FROM vehiculos', (err, resultados) => {
        if (err) {
            return res.status(500).json({ error: 'Error al obtener los vehículos de la base de datos.' });
        }
        res.json(resultados);
    });
});

// CREATE. Agregar un nuevo vehículo (Protegido con JWT)
app.post('/api/vehiculos', verificarToken, (req, res) => {
    const {marca, modelo, anio, precio, estado} = req.body;

    const query = 'INSERT INTO vehiculos (marca, modelo, anio, precio, estado) VALUES (?, ?, ?, ?, ?)';
    db.query(query, [marca, modelo, anio, precio, estado], (err, resultado) => {
        if (err) {
            return res.status(500).json({error: 'Error al registrar el vehiculo.'});
        }
        res.json({ mensaje: 'Vehículo agregado exitosamente', id: resultado.insertId});
    });
});

// UPDATE: Modificar un vehículo existente (Protegido con JWT)
app.put('/api/vehiculos/:id', verificarToken, (req, res) => {
    const { id } = req.params;
    const { marca, modelo, anio, precio, estado } = req.body;

    const query = 'UPDATE vehiculos SET marca = ?, modelo = ?, anio = ?, precio = ?, estado = ? WHERE id = ?';
    db.query(query, [marca, modelo, anio, precio, estado, id], (err, resultado) => {
        if (err) {
            return res.status(500).json({ error: 'Error al actualizar el vehículo.' });
        }
        res.json({ mensaje: 'Vehículo actualizado correctamente' });
    });
});

// DELETE: Eliminar un vehículo (Protegido con JWT)
app.delete('/api/vehiculos/:id', verificarToken, (req, res) => {
    const { id } = req.params;

    db.query('DELETE FROM vehiculos WHERE id = ?', [id], (err, resultado) => {
        if (err) {
            return res.status(500).json({ error: 'Error al eliminar el vehículo.' });
        }
        res.json({ mensaje: 'Vehículo eliminado correctamente' });
    });
});

// Hace que la carpeta "public" sea visible como archivos estáticos en la web
app.use(express.static('public'));

// ------- INICIAR EL SERVIDOR:
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Servidor corriendo en el puerto http://localhost:${PORT}`)
});