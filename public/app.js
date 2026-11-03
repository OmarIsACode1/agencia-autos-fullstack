// URL base de la API REST local
const API_URL = 'http://localhost:3000/api';

// Elementos del DOM
const seccionLogin = document.getElementById('seccion-login');
const seccionApp = document.getElementById('seccion-app');
const btnLogin = document.getElementById('btn-login');
const btnLogout = document.getElementById('btn-logout');

// Verificar si ya hay una sesión activa al cargar la página
document.addEventListener('DOMContentLoaded', () => {
    const token = localStorage.getItem('token');
    if (token) {
        mostrarApp();
    }
});

// Lógica de Inicio de Sesión (Login)
btnLogin.addEventListener('click', async () => {
    const email = document.getElementById('login-email').value;
    const password = document.getElementById('login-password').value;

    if (!email || !password) {
        alert('Por favor, ingresa tu correo y contraseña.');
        return;
    }

    try {
        const respuesta = await fetch(`${API_URL}/login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email, password })
        });

        const resultado = await respuesta.json();

        if (respuesta.ok) {
            // Guardar el token JWT en el almacenamiento local del navegador
            localStorage.setItem('token', resultado.token);
            alert('¡Inicio de sesión exitoso!');
            mostrarApp();
        } else {
            alert(`Error de autenticación: ${resultado.error || 'Credenciales inválidas'}`);
        }
    } catch (error) {
        console.error('Error en el login:', error);
        alert('No se pudo conectar con el servidor.');
    }
});

// Lógica para registrarse directamente desde la interfaz
document.getElementById('btn-registrar').addEventListener('click', async () => {
    const email = document.getElementById('login-email').value;
    const password = document.getElementById('login-password').value;

    if (!email || !password) {
        alert('Por favor, escribe un correo y una contraseña para registrarte.');
        return;
    }

    try {
        const respuesta = await fetch(`${API_URL}/registro`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email, password })
        });

        const resultado = await respuesta.json();

        if (respuesta.ok) {
            alert('¡Usuario registrado con éxito! Ahora haz clic en "Ingresar".');
        } else {
            alert(`Error: ${resultado.error || 'No se pudo registrar'}`);
        }
    } catch (error) {
        console.error('Error en el registro:', error);
        alert('No se pudo conectar con el servidor.');
    }
});

// Función para cambiar la vista al panel principal
function mostrarApp() {
    seccionLogin.style.display = 'none';
    seccionApp.style.display = 'block';
    cargarVehiculos();
}

// Botón de Cerrar Sesión
btnLogout.addEventListener('click', () => {
    localStorage.removeItem('token');
    seccionApp.style.display = 'none';
    seccionLogin.style.display = 'block';
    document.getElementById('login-email').value = '';
    document.getElementById('login-password').value = '';
});

// Función para obtener la lista de vehículos desde MySQL y renderizarlos de forma segura
async function cargarVehiculos() {
    try {
        const respuesta = await fetch(`${API_URL}/vehiculos`);
        const vehiculos = await respuesta.json();

        const listaUl = document.getElementById('lista-vehiculos');
        if (!listaUl) return;
        listaUl.innerHTML = '';

        // Validar que la respuesta sea un arreglo para evitar que la app colapse en blanco
        if (!Array.isArray(vehiculos)) {
            listaUl.innerHTML = `<li>Error: ${vehiculos.error || 'No se pudo obtener el inventario'}</li>`;
            return;
        }

        if (vehiculos.length === 0) {
            listaUl.innerHTML = '<li>No hay vehículos registrados en la base de datos.</li>';
            return;
        }

        vehiculos.forEach(vehiculo => {
            const li = document.createElement('li');
            li.innerHTML = `
                <div>
                    <strong>${vehiculo.marca} ${vehiculo.modelo}</strong> (${vehiculo.anio}) 
                    - $${vehiculo.precio} <em>[${vehiculo.estado}]</em>
                </div>
                <div>
                    <button onclick="editarVehiculo(${vehiculo.id})" style:"background-color: #10b981;">Editar</button>
                    <button onclick="eliminarVehiculo(${vehiculo.id})" style="background-color: #dc2626;">Eliminar</button>
                </div>
            `;
            listaUl.appendChild(li);
        });
    } catch (error) {
        console.error('Error al obtener los vehículos:', error);
        const listaUl = document.getElementById('lista-vehiculos');
        if (listaUl) {
            listaUl.innerHTML = '<li>Error de conexión al cargar el inventario.</li>';
        }
    }
}

// Función para editar un vehículo existente
async function editarVehiculo(id) {

    // 1. Obtener los vehículos de la base de datos
    const respuestaVehiculos = await fetch(`${API_URL}/vehiculos`);
    const vehiculos = await respuestaVehiculos.json();

    // 2. Buscar el vehículo que queremos editar
    const vehiculo = vehiculos.find(v => v.id == id);

    if (!vehiculo) {
        alert('No se encontró el vehículo.');
        return;
    }

    // 3. Solicitar los nuevos datos
    const marca = prompt('Nueva marca:', vehiculo.marca);
    if (marca === null) return;

    const modelo = prompt('Nuevo modelo:', vehiculo.modelo);
    if (modelo === null) return;

    const anio = prompt('Nuevo año:', vehiculo.anio);
    if (anio === null) return;

    const precio = prompt('Nuevo precio:', vehiculo.precio);
    if (precio === null) return;

    const estado = prompt('Nuevo estado:', vehiculo.estado);
    if (estado === null) return;

    // 4. Validar los datos
    if (!marca.trim() || !modelo.trim() || !anio.trim() || !precio.trim() || !estado.trim()) {
        alert('Todos los campos son obligatorios.');
        return;
    }

    if (!Number.isFinite(Number(anio)) || !Number.isFinite(Number(precio))) {
        alert('El año y el precio deben ser números.');
        return;
    }

    // 5. Preparar el objeto con los nuevos datos
    const vehiculoActualizado = {
        marca,
        modelo,
        anio: Number(anio),
        precio: Number(precio),
        estado
    };

    // 6. Obtener el token JWT
    const token = localStorage.getItem('token');

    try {

        // 7. Enviar los cambios al servidor mediante PUT
        const respuesta = await fetch(`${API_URL}/vehiculos/${id}`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify(vehiculoActualizado)
        });

        const resultado = await respuesta.json();

        if (respuesta.ok) {
            alert('¡Vehículo actualizado correctamente!');

            // 8. Actualizar el inventario
            cargarVehiculos();

        } else {
            alert(`Error: ${resultado.error || 'No se pudo actualizar el vehículo.'}`);
        }

    } catch (error) {
        console.error('Error al editar vehículo:', error);
        alert('No se pudo conectar con el servidor.');
    }
}

// Función para agregar un nuevo vehículo mediante Toekn JWT en los headers
document.getElementById('btn-guardar').addEventListener('click', async () => {
    const marca = document.getElementById('marca').value;
    const modelo = document.getElementById('modelo').value;
    const anio = document.getElementById('anio').value;
    const precio = document.getElementById('precio').value;
    const estado = document.getElementById('estado').value;

    if (!marca || !modelo || !anio || !precio || !estado) {
        alert('Por favor, completa todos los campos del vehículo.');
        return;
    }

    const token = localStorage.getItem('token');
    const nuevoVehiculo = { marca, modelo, anio: Number(anio), precio: Number(precio), estado };

    try {
        const respuesta = await fetch(`${API_URL}/vehiculos`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}` // Enviamos el JWT requerido por el backend
            }, 
            body: JSON.stringify(nuevoVehiculo)
        });

        const resultado = await respuesta.json();

        if (respuesta.ok) {
            alert('¡Vehículo registrado con éxito!');
            // Limpiar inputs
            document.getElementById('marca').value = '';
            document.getElementById('modelo').value = '';
            document.getElementById('anio').value = '';
            document.getElementById('precio').value = '';
            document.getElementById('estado').value = '';

            // Recargar lista
            cargarVehiculos();
        } else {
            alert(`Error: ${resultado.error || 'No se pudo registrar el vehículo'}`);
        }
    } catch (error) {
        console.error('Error al guardar el vehículo:', error);
    }
});

// Función para eliminar un vehículo
async function eliminarVehiculo(id) {
    if (!confirm('¿Estás seguro de que deseas eliminar este vehículo?')) return;

    const token = localStorage.getItem('token');

    try {
        const respuesta = await fetch(`${API_URL}/vehiculos/${id}`, {
            method: 'DELETE',
            headers: {'Authorization': `Bearer ${token}` } // Enviamos el JWT requerido por el backend
        });

        const resultado = await respuesta.json();

        if(respuesta.ok) {
            alert('Vehiculo eliminado');
            cargarVehiculos();
        } else {
            alert(`Error: ${resultado.error || 'No se pudo eliminar'}`);
        }
    } catch (error) {
        console.error('Error al eliminar vehículo:', error);
    }
}

// Cargar inventario automáticamente al abrir la página
document.addEventListener('DOMContentLoaded', cargarVehiculos);