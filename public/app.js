// URL base de la API REST local
const API_URL = 'http://localhost:3000/api';

// Función para obtener la lista de vehículos desde MySQL y renderizarlos en el DOM
async function cargarVehiculos() {
    try {
        const respuesta = await fetch(`${APT_URL}/vehiculos`);
        const vehiculos = await respuesta.json();

        const listaUl = document.getElementById('lista-vehiculos');
        listaUl.innerHTML = '';

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
                    <button onclick="eliminarVehiculo(${vehiculo.id})">Eliminar</button>
                </div>
            `;
            listaUl.appendChild(li);
        });
    } catch (error) {
        console.error('Error al obtener los vehículos:', error);
    }
}

// Función para agregar un nuevo vehículo mediante POST
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

    const nuevoVehiculo = { marca, modelo, anio: Number(anio), precio: Number(precio), estado };

    try {
        // Nota: Por el momento no tenemos una pantalla de Login para generar y guardar un token (JWT),
        // así que podemos omitir temporalmente la línea de autenticación para que el formulario guarde los datos directamente.
        // Cuando contectemos el sistema de usuarios y login, lo quitaremos y le pasaremos el token real que 
        // obtengamos al iniciar sesión para que el servidor no rechace la petición por seguridad. 
        const respuesta = await fetch(`${API_URL}/vehiculos`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
                // 'Authorization': `Bearer ${token}` // Descomentaremos esto si usamos token de sesión
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
            alert(`Error: ${resultado.error || 'No se pudo registrar el vehículo'}`)
        }
    } catch (error) {
        console.error('Error al guardar el vehículo:', error);
    }
});

// Función para eliminar un vehículo
async function eliminarVehiculo(id) {
    if (!confirm('¿Estás seguro de que deseas eliminar este vehículo?')) return;

    try {
        const respuesta = await fetch(`${API_URL}/vehiculos/${id}`, {
            method: 'DELETE'
            // headers: {'Authorization': `Bearer ${token}` } // Descomentar si usas token
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