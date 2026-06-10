
// Função só é executada depois de o HMTL ser todo carregado
document.addEventListener('DOMContentLoaded', () => {

    // Variáveis pra guardar os elementos que vamos maipular
    const inputFoto = document.getElementById('foto') 
    const previewBox = document.getElementById('preview-box') 
    const previewImg = document.getElementById('preview-img') 

    // Só executa o resto se houver a caixinha de foto e os outros elementos
    if(inputFoto && previewBox && previewImg){

        // Se não houver imagem carregada ou tiver vazio, colocar uma imagem padrão
        if(!previewImg.getAttribute('src') || previewImg.getAttribute('src') === "..." || previewImg.getAttribute('src') === ""){
            previewImg.src = '/img/sem-foto.png'
            previewBox.style.display = 'block'
        }

        // Se selecionar uma imagem
        inputFoto.addEventListener('change', function(evento) {
            // Guarda as informações da imagem
            const arquivo = evento.target.files[0]

            // Se tiver um arquivo selecionado
            if(arquivo){
                // Usa o filereader para o navegador ler arquivos do PC
                const leitorDeArquivo = new FileReader()

                // Quando a imagem for carregada na memória, substitui o sem foto para a imagem selecionada
                leitorDeArquivo.onload = function(e){
                    previewImg.src = e.target.result
                    previewBox.style.display = 'block'
                }
                // Converte a imagem para Base64 para o html ler a imagem como texto
                leitorDeArquivo.readAsDataURL(arquivo)
            }
            // Se cancelar o envio, volta foto padrão
            else{
                previewImg.src = '/img/sem-foto.png'
                previewBox.style.display = 'block'
            }
        })
    }
})