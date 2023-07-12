document.addEventListener('DOMContentLoaded', (event) => {
    fetch('https://deissms.github.io/pmo_m/consolidado.json')
    .then(response => response.json())
    .then(data => {
        let categories = [...new Set(data.map(item => item.categoria))];
        let selectElement = document.getElementById('categoria');
        categories.forEach(category => {
            let optionElement = document.createElement('option');
            optionElement.value = category;
            optionElement.textContent = category;
            selectElement.appendChild(optionElement);
        });

        document.getElementById('busqueda').addEventListener('input', function(e) {
            document.getElementById('categoria').value = '';
        });

        document.getElementById('categoria').addEventListener('change', function(e) {
            document.getElementById('busqueda').value = '';
        });
        
        document.getElementById('buscador').addEventListener('submit', function(e) {
            e.preventDefault();
            document.getElementById('texto-seccion').innerHTML = ''; // limpia los resultados anteriores
            var valorBuscado = document.getElementById('busqueda').value;
            var valorCategoria = document.getElementById('categoria').value;

            var resultado = data.filter(function(obj) {
                if (valorBuscado !== "") {
                    return obj.nombre.toLowerCase().includes(valorBuscado.toLowerCase()) || obj.categoria.toLowerCase().includes(valorBuscado.toLowerCase());
                } else {
                    return obj.categoria === valorCategoria;
                }
            });

            if (resultado.length > 0) {
                document.getElementById('texto-seccion').style.display = 'block';
                var coberturas = resultado.map(function(obj) {
                    var coberturaText;
                    if (isNumeric(obj.cobertura)) {
                      coberturaText = (obj.cobertura * 100) + '%';
                    } else {
                      coberturaText = obj.cobertura;
                    }
                    return '<p class="nombre-resultado">'+ obj.nombre +'</p>' +
                           '<p class="resultado">CategorÍa: ' + obj.categoria + '</p>' +
                           '<p class="resultado">SubcategorÍa: ' + obj.subcategoria + '</p>' +
                           '<p class="resultado">Normativa que la incluye: ' + obj.norma + '</p>' +
                           '<p class="resultado"><b>Nivel de cobertura: ' + coberturaText + '</b></p>' +
                           '<p class="resultado">Recomendaciones de uso: ' + obj.recomendaciones + '</p>';
                });

                var tituloResultado = resultado.length === 1 ? "Resultado de la búsqueda: 1 prestación encontrada" : "Resultado de la búsqueda: " + resultado.length + " prestaciones encontradas";

                document.getElementById('texto-seccion').innerHTML = `
                  <div class="acciones">
                    <button id="descargar-resultados" class="boton-accion">Descargar Resultados</button>
                    <button id="descargar-consolidado" class="boton-accion">Descargar Canasta Prestacional</button>
                    <a href="https://www.argentina.gob.ar/normativa/nacional/resolución-201-2002-73649/actualizacion" target="_blank" class="boton-accion">Ver legislación</a>
                  </div>
                  <h2 class="titulo-resultado">${tituloResultado}</h2>
                  ` + coberturas.join('<hr>');

                document.getElementById('descargar-consolidado').addEventListener('click', function() {
                  window.location.href = 'data/consolidado.xlsx'; // Cambiar la ruta del archivo si es necesario
                });

                document.getElementById('descargar-resultados').addEventListener('click', function() {
                  /* Crear un objeto de libro de trabajo */
                  var wb = XLSX.utils.book_new();
                  wb.Props = {
                      Title: "Resultados de la búsqueda",
                      Author: "Tu nombre",
                      CreatedDate: new Date()
                  };

                  /* Crear una hoja de cálculo */
                  wb.SheetNames.push("Resultados");

                  /* Convertir los datos a formato de hoja de cálculo */
                  var ws_data = resultado.map(function(obj) {
                      return [
                          obj.nombre,
                          obj.categoria,
                          obj.subcategoria,
                          obj.norma,
                          isNumeric(obj.cobertura) ? (obj.cobertura * 100) + '%' : obj.cobertura,
                          obj.recomendaciones
                      ];
                  });
                  ws_data.unshift(["Nombre", "Categoría", "Subcategoría", "Normativa", "Nivel de cobertura", "Recomendaciones"]); // Añadir encabezados de columna

                  var ws = XLSX.utils.aoa_to_sheet(ws_data);

                  /* Añadir la hoja de cálculo al libro de trabajo */
                  wb.Sheets["Resultados"] = ws;

                  /* Guardar el libro de trabajo como archivo XLSX */
                  var wbout = XLSX.write(wb, {bookType:'xlsx', type: 'binary'});
                  saveAs(new Blob([s2ab(wbout)],{type:"application/octet-stream"}), 'resultados.xlsx');
                });
            } else {
                alert('No se encontró el valor buscado');
            }
        });
    })
    .catch(error => console.error('Error:', error));
});

document.getElementById('pmo').addEventListener('click', function(e) {
    e.preventDefault();
    window.open('pmo.html', '_blank');
});

document.getElementById('leyes').addEventListener('click', function(e) {
    e.preventDefault();
    window.open('leyes.html', '_blank');
});

function isNumeric(n) {
  return !isNaN(parseFloat(n)) && isFinite(n);
}

function s2ab(s) { 
    var buf = new ArrayBuffer(s.length);
    var view = new Uint8Array(buf); 
    for (var i=0; i<s.length; i++) view[i] = s.charCodeAt(i) & 0xFF; 
    return buf;    
}

