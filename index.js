const express = require('express')
const app = express()
const bodyParser = require('body-parser')

const path = require('path')

const sqlite = require('aa-sqlite')
const { request } = require('express')
const dbConnection = sqlite.open(path.resolve(__dirname,'banco.sqlite'), {Promise})
const port = process.env.PORT || 3000

app.use('/admin', (req, res, next) => {
    if(req.hostname === 'localhost'){
        next()
    }else {
        res.send('Not allowed')
    }
    console.log(req.hostname)
})

app.set('views', path.join(__dirname, 'views'))
app.set('view engine', 'ejs')
app.use(express.static(path.join(__dirname,'public')))
app.use(bodyParser.urlencoded({extended: true}))

app.get('/', async(request,response) => {
    const categoriasDb = await sqlite.all('select * from categorias;')
    const vagas = await sqlite.all('select * from vagas;')
    const categorias = categoriasDb.map(cat =>{
        return {
            ...cat,
            vagas: vagas.filter( vaga=> vaga.categoria === cat.id)
        }
    })
    response.render('home', {
        categorias
    })
})
app.get('/vaga/:id', async(request,response) => {
    console.log(request.params)
    await dbConnection
    const vaga = await sqlite.get('select * from vagas where id = '+ request.params.id)
    console.log(vaga)
    response.render('vaga', {
        vaga
    })
})

app.get('/admin', (req,res) =>{
    res.render('admin/home')
})

app.get('/admin/vagas', async(req,res) =>{
    await dbConnection
    const vagas = await sqlite.all('select * from vagas;')
    res.render('admin/vagas', {vagas})
})

app.get('/admin/categorias', async(req,res)  =>{
    await dbConnection
    const categorias = await sqlite.all('select * from categorias')
    res.render('admin/categorias', {categorias})

})

app.get('/admin/vagas/delete/:id', async(req,res) => {
    await dbConnection
    await sqlite.run('delete from vagas where id = '+req.params.id)
    res.redirect('/admin/vagas')
})

app.get('/admin/categorias/delete/:id', async(req,res)=> {
    await dbConnection
    console.log(req.params.id)
    await sqlite.run('delete from categorias where id =' +req.params.id)
    await sqlite.run('delete from vagas where categoria = '+req.params.id)
    res.redirect('/admin/categorias')
})

app.get('/admin/vagas/nova', async(req,res) => {
    await dbConnection
    const categorias = await sqlite.all('select * from categorias;')
    res.render('admin/nova-vaga', {categorias})
})

app.get('/admin/categorias/nova', async(req,res) =>{
    await dbConnection
    res.render('admin/nova-categoria')
})

app.post('/admin/vagas/nova', async(req,res) => {
    const {titulo, descricao, categoria} = req.body
    console.log(req.body)
    await dbConnection
    await sqlite.run(`insert into vagas(categoria, titulo, descricao) values('${categoria}','${titulo}','${descricao}')`)
    res.redirect('/admin/vagas')
})

app.post('/admin/categorias/nova', async(req,res) => {
    const {categoria} = req.body
    console.log(req.body)
    await dbConnection
    await sqlite.run(`insert into categorias(categoria) values('${categoria}')`)
    res.redirect('/admin/categorias')

})


app.get('/admin/vagas/editar/:id', async(req,res) => {
    await dbConnection
    const categorias = await sqlite.all('select * from categorias;')
    const vaga = await sqlite.get('select * from vagas where id ='+req.params.id)
    res.render('admin/editar-vaga', {categorias, vaga})
})

app.get('/admin/categorias/editar/:id', async(req,res) => {
    await dbConnection
    const categoria = await sqlite.get('select * from categorias where id ='+req.params.id)
    res.render('admin/editar-categoria', {categoria})
})

app.post('/admin/vagas/editar/:id', async(req,res) => {
    const {titulo, descricao, categoria} = req.body
    const {id} = req.params
    await dbConnection
    await sqlite.run(`update vagas set categoria = '${categoria}', titulo = '${titulo}', descricao = '${descricao}' where id = '${id}'`)
    res.redirect('/admin/vagas')
})

app.post('/admin/categorias/editar/:id', async(req,res) => {
    console.log(req.body)
    const {categoria} = req.body
    const {id} = req.params
    await dbConnection
    await sqlite.run(`update categorias set categoria = '${categoria}' where id = '${id}'`)
    res.redirect('/admin/categorias')
})

const init = async() => {
    await dbConnection
    await sqlite.run('create table if not exists categorias (id INTEGER PRIMARY KEY, categoria TEXT);')
    await sqlite.run('create table if not exists vagas (id INTEGER PRIMARY KEY, categoria INTEGER, titulo TEXT, descricao TEXT);')

    //const categoria = 'Marketing team'
    //await sqlite.run(`insert into categorias(categoria) values('${categoria}')`)
    //const vaga = 'Social Media'
    //const descricao = 'Vaga para fullstack developer que fez o Fullstack Lab'
    //await sqlite.run(`insert into vagas(categoria, titulo, descricao) values(2,'${vaga}','${descricao}')`)

}
init()

app.listen(port, (err) => {
    if(err) {
        console.log('Nao foi possivel iniciar o servidor')
    }else{
        console.log('Servidor do Jobify rodando...')
    }
})