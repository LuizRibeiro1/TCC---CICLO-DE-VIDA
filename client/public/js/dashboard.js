document.addEventListener('DOMContentLoaded', () => {
    document.querySelectorAll('.menu-acoes').forEach((menu) => {
        const botao = menu.querySelector('.btn-menu-acoes')
        const dropdown = menu.querySelector('.menu-acoes-dropdown')

        if (!botao || !dropdown) return

        botao.addEventListener('click', (evento) => {
            evento.stopPropagation()

            document.querySelectorAll('.menu-acoes-dropdown.ativo').forEach((aberto) => {
                if (aberto !== dropdown) aberto.classList.remove('ativo')
            })

            dropdown.classList.toggle('ativo')
        })
    })

    document.addEventListener('click', () => {
        document.querySelectorAll('.menu-acoes-dropdown.ativo').forEach((dropdown) => {
            dropdown.classList.remove('ativo')
        })
    })
})
