document.addEventListener('DOMContentLoaded', async () => {
    const profesorSelect = document.getElementById('profesor');
    const materiaSelect = document.getElementById('materia');

    // Obtener profesores
    try {
        const profesoresResponse = await fetch('http://localhost:3000/get-profesores');
        if (profesoresResponse.ok) {
            const profesoresData = await profesoresResponse.json();
            profesoresData.forEach(profesor => {
                const option = document.createElement('option');
                option.value = profesor.Cedula;
                option.textContent = `${profesor.Nombre} (${profesor.Usuario})`; // Usamos template literals correctamente
                profesorSelect.appendChild(option);
            });
        } else {
            console.error('Error al cargar profesores:', profesoresResponse.statusText);
        }
    } catch (error) {
        console.error('Error al hacer la petición de profesores:', error);
    }

    // Obtener materias
    try {
        const materiasResponse = await fetch('http://localhost:3000/get-materias');
        if (materiasResponse.ok) {
            const materiasData = await materiasResponse.json();
            materiasData.forEach(materia => {
                const option = document.createElement('option');
                option.value = materia.IdMateria;
                option.textContent = materia.Nombre;
                materiaSelect.appendChild(option);
            });
        } else {
            console.error('Error al cargar materias:', materiasResponse.statusText);
        }
    } catch (error) {
        console.error('Error al hacer la petición de materias:', error);
    }
});

document.getElementById('dia').addEventListener('change', async (event) => {
    const dia = event.target.value;
    const horaSelect = document.getElementById('hora');

    // Limpiar las opciones anteriores
    horaSelect.innerHTML = '';

    if (dia) {
        try {
            // Corregir la URL con template literals y comillas invertidas
            const response = await fetch(`http://localhost:3000/get-horas-disponibles?dia=${dia}`);
            if (response.ok) {
                const horasDisponibles = await response.json();
                // Mostrar horas disponibles
                horasDisponibles.forEach(hora => {
                    const option = document.createElement('option');
                    option.value = hora.HoraIni; // Ajusta según la propiedad que contiene la hora
                    option.textContent = hora.HoraIni; // Muestra la hora
                    horaSelect.appendChild(option);
                });
                horaSelect.style.display = 'block'; // Mostrar el select de horas
            } else {
                console.error('Error al cargar horas disponibles:', response.statusText);
            }
        } catch (error) {
            console.error('Error en la solicitud de horas disponibles:', error);
        }
    } else {
        horaSelect.style.display = 'none'; // Ocultar el select de horas si no hay día seleccionado
    }
});
