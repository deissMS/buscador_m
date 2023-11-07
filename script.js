function levenshtein(a, b) {
    if (a.length === 0) return b.length;
    if (b.length === 0) return a.length;

    var matrix = [];

    var i;
    for (i = 0; i <= b.length; i++) {
        matrix[i] = [i];
    }

    var j;
    for (j = 0; j <= a.length; j++) {
        matrix[0][j] = j;
    }

    for (i = 1; i <= b.length; i++) {
        for (j = 1; j <= a.length; j++) {
            if (b.charAt(i - 1) == a.charAt(j - 1)) {
                matrix[i][j] = matrix[i - 1][j - 1];
            } else {
                matrix[i][j] = Math.min(matrix[i - 1][j - 1] + 1, Math.min(matrix[i][j - 1] + 1, matrix[i - 1][j] + 1));
            }
        }
    }

    return matrix[b.length][a.length];
}

document.addEventListener('DOMContentLoaded', (event) => {
    fetch('https://deissms.github.io/buscador_m/consolidado.json')
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
            var valorBuscado = eliminarAcentos(document.getElementById('busqueda').value.toLowerCase());
            var valorCategoria = document.getElementById('categoria').value;

            var resultado = data.filter(function(obj) {
                let nombreNormalizado = eliminarAcentos(obj.nombre.toLowerCase());
                let categoriaNormalizada = eliminarAcentos(obj.categoria.toLowerCase());

                if (valorBuscado !== "") {
                    if (nombreNormalizado.includes(valorBuscado) || categoriaNormalizada.includes(valorBuscado)) {
                        obj.levenshteinDistance = 0; // Distancia 0 para coincidencias exactas
                        return true;
                    }
                    
                    let umbralLevenshtein = getLevenshteinThreshold(valorBuscado); // Obtener el umbral basado en la longitud de la palabra
                    
                    for (let i = 0; i <= nombreNormalizado.length - valorBuscado.length; i++) {
                        const segmento = nombreNormalizado.substr(i, valorBuscado.length);
                        let distance = levenshtein(segmento, valorBuscado);
                        if (distance <= umbralLevenshtein) {
                            obj.levenshteinDistance = distance;
                            return true;
                        }
                    }
                    return false;
                }
                 else {
                    return obj.categoria === valorCategoria;
                }
            });

            resultado.sort((a, b) => a.levenshteinDistance - b.levenshteinDistance);

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
                    <button id="ver-legislacion" class="boton-accion">Ver legislación</button>
                </div>
                <h2 class="titulo-resultado">${tituloResultado}</h2>
                <p class="subtitulo-resultado">En caso de que las prestaciones se brinden en modalidad de internación, el Anexo I de la Resolución 201/2002 MS del PMO establece que la cobertura de las mismas deberá ser del 100%. 
                Para aquellos casos en donde las prestaciones sean ambulatorias, y con excepción de aquellas en donde la legislación establece un nivel de cobertura explícito, los financiadores tienen permitido el cobro de un coseguro. 
                Podés ver los valores de coseguros máximos autorizados por la Superintendencia de Servicios de Salud <a class="links" href="https://www.argentina.gob.ar/sssalud/valores-coseguros" target="_blank" rel="noopener">haciendo clic aquí</a>.</p>
                ` + coberturas.join('<hr>');

                document.getElementById('descargar-consolidado').addEventListener('click', function() {
                  window.location.href = 'data/consolidado.xlsx'; // Cambiar la ruta del archivo si es necesario
                });

                document.getElementById('ver-legislacion').addEventListener('click', function() {
                    window.open('legislacion.html', '_blank');
                    });
                    
                document.getElementById('descargar-resultados').addEventListener('click', function() {
                  /* Crear un objeto de libro de trabajo */
                var wb = XLSX.utils.book_new();
                wb.Props = {
                    Title: "Resultados de la búsqueda",
                    Author: "Ministerio de Salud de la Nación",
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

function getLevenshteinThreshold(word) {
    if(word.length < 5) {
        return 1; // Umbral estricto para palabras cortas
    } else if(word.length < 8) {
        return 2; // Umbral medio para palabras de longitud media
    } else {
        return 3; // Umbral más flexible para palabras largas
    }
}

document.getElementById('pmo').addEventListener('click', function(e) {
    e.preventDefault();
    window.open('pmo.html', '_blank');
});

document.getElementById('leyes').addEventListener('click', function(e) {
    e.preventDefault();
    window.open('leyes.html', '_blank');
});

function eliminarAcentos(texto) {
    return texto.normalize('NFD').replace(/[\u0300-\u036f]/g, "");
}

function isNumeric(n) {
    return !isNaN(parseFloat(n)) && isFinite(n);
}

function s2ab(s) { 
    var buf = new ArrayBuffer(s.length);
    var view = new Uint8Array(buf); 
    for (var i=0; i<s.length; i++) view[i] = s.charCodeAt(i) & 0xFF; 
    return buf;    
}
