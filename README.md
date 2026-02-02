# hackescala (Node.js)

CLI para consultar a escala de equipe da Mídia Videira.

## Instalação

1. Clone o repositório:
   ```bash
   git clone https://github.com/jorgesfreita/hackescala.git
   cd hackescala
   ```

2. Instale as dependências:
   ```bash
   npm install
   ```

## Como usar

Execute o comando passando o token da área:

```bash
node hackescala.js --token=49ea2014-cc3a-406d-aa92-5f73bc477e3f
```

### Opções

- `-t, --token <token>`: **(Obrigatório)** Token da área agendada.
- `-c, --count <number>`: Quantidade de resultados futuros a retornar (padrão: 2).
- `-j, --json`: Retornar os dados em formato JSON puro.

### Exemplo de saída formatada

```text
--- Escala 1 ---
Data: Domingo, 01 de fevereiro de 2026 às 18:00

Equipe:
  - Carlos Eduardo (Baterista)
  - João Marcos (Contra Baixo)
  ...

Hinos:
  - Ruja o Leão - FHOP
  - Como Prometeste - Voz de Muitas Águas
  ...
```
