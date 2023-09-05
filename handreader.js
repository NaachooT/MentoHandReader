const { Client, Intents, Permissions } = require('discord.js');

const { clientId, guildId, token, user, password, host, database, port, adminRole, supportChannelID, roles, userTable } = require('./config.json');
const mysql = require('mysql');
const imgur = require('imgur-upload'),
    path = require('path'),
    fs = require('fs'),
    request = require('request');
const jsftp = require("jsftp");
const ftp = new jsftp({
    host: "ftp.mentopoker.com",
    port: 21, // defaults to 21
    user: "mentobot@mentopoker.com", // defaults to "anonymous"
    pass: "]1i1qm@3h#^#" // defaults to "@anonymous"
});

//Cash, Spins, MTTs
const coachRolesID = ['655925180819832842', '653273038594375692', '674580638413881345'];
//const coachRolesID = ['932666956958531654'];
//Spins > Cash > MTT
const canalesManos = ['653267901628940349', '653267606618505229', '653267723953897522', '804029265523376158', '655925523242942474', '655925718508634122', '674581131085217812', '674581229710082061']
//const canalesManos = ['653267723953897522', '653267606618505229', '655925523242942474'];
//const canalesManos = ['932967261940117504']

const client = new Client({ intents: ["GUILDS", "GUILD_MESSAGES", "GUILD_MEMBERS", "DIRECT_MESSAGES", "GUILD_MESSAGE_REACTIONS"], partials: ['MESSAGE', 'CHANNEL', 'REACTION'], fetchAllMembers: true });

const clientIdImgur = 'a704bcf3bd51487';

function createQuery(query, callback) {
    var result;
    var con = mysql.createConnection({
        host: host,
        user: user,
        password: password,
        database: database,
        port: port
    });

    con.connect(function (err) {
        if (err) throw err;
        //console.log('Connected!');


        con.query(query, function (error, rows, fields) {
            if (!!error) {
                console.log(error);
                return callback('error');
            } else {
                con.end();
                return callback(rows);
            }
        })
    });


}

client.once('ready', () => {
    console.log('Ready!');





});

function sleep(ms) {
    return new Promise((resolve) => {
        setTimeout(resolve, ms);
    });
}

var tituloMano;
var tituloTagMano;
var manoJugador;
var manoSuited;
var posicionJugador;
var posicionVillano;
var iniciativa;
var stackEfectivo;
var posicion;
var numActivos;
var numActivosStr;
var numMax;

client.on('messageReactionAdd', async (reaction, user) => {


    var mensaje;
    var adjunto;

    var resolucion;
    var msjManoID;
    var coachID;

    var noAutorizado = false;

    //Si no es un canal de manos no entra
    if (!canalesManos.includes(reaction.message.channel.id))
        return;
    //Si la reacción no es de un coach no entra
    let guild = client.guilds.cache.get(guildId);
    guild.members.fetch(user.id).then(members => {
        if (!members.roles.cache.some(role => coachRolesID.includes(role.id))) {
            /*reaction.message.channel.messages.fetch(reaction.message.id).then(message => {
                msg.reactions.resolve(reaction.id).users.remove(user.id);
            });*/
            //return;
            //Me pongo a mi mismo el poder
            if (user.id != "269920447439699978") {
                reaction.message.channel.messages.fetch(reaction.message.id).then(message => {
                    //reaction.users.remove(user.id);
                    noAutorizado = true;
                });
                return;
            } else {
                coachID = user.id;
            }
        } else {
            coachID = user.id;
        }
    })
    await sleep(500);
    if (noAutorizado)
        return;

    var canalesSpins = ['653267901628940349', '653267606618505229', '653267723953897522'];
    var canalesCash = ['804029265523376158', '655925523242942474', '655925718508634122'];
    var canalesMTT = ['674581131085217812', '674581229710082061'];

    //Conseguimos la información del mensaje
    reaction.message.channel.messages.fetch(reaction.message.id).then(message => {
        mensaje = message.content;
        adjunto = message.attachments.first()["url"];
        msjManoID = message.id;

        mensaje = mensaje.replaceAll('**', '');
        mensaje = mensaje.replaceAll("'", "´");
        
        //Conseguimos los tags
        if (mensaje.indexOf('TÍTULO:') > -1) {
            //Tag mano
            tituloMano = mensaje.substring(mensaje.indexOf('TÍTULO:'), mensaje.indexOf('\n'));
            mensaje = mensaje.replace(tituloMano, '');
            mensaje = mensaje.replace('\n', '');
            tituloMano = tituloMano.replace('TÍTULO:', '').trim();
            tituloMano = tituloMano.replaceAll('.', '');
            console.log(tituloMano);
            //Tag título mano desc
            tituloTagMano = tituloMano.replaceAll('(', '');
            tituloTagMano = tituloMano.replaceAll(')', '');
            tituloTagMano = tituloMano.replaceAll(' ', '-');
            
            //Mano jugador
            if(mensaje.indexOf('MANO INCIAL:') != -1){
                manoJugador = mensaje.substring(mensaje.indexOf('MANO INCIAL:'), mensaje.indexOf('\n'));
                mensaje = mensaje.replace(manoJugador, '');
                manoJugador = manoJugador.replace('MANO INCIAL:', '').trim();
                manoJugador = manoJugador.replace('-', '').replace(' ', '');
            }else if(mensaje.indexOf('MANOINCIAL:') != -1){
                manoJugador = mensaje.substring(mensaje.indexOf('MANOINCIAL:'), mensaje.indexOf('\n'));
                mensaje = mensaje.replace(manoJugador, '');
                manoJugador = manoJugador.replace('MANOINCIAL:', '').trim();
                manoJugador = manoJugador.replace('-', '').replace(' ', '');
            }

            mensaje = mensaje.replace(manoJugador, '');
            manoJugador = manoJugador.replace('MANO INCIAL:', '').trim();
            manoJugador = manoJugador.replace('-', '').replace(' ', '');
            tituloTagMano = tituloTagMano+'-'+manoJugador;
            console.log('Titulo Tag Mano: '+tituloTagMano);
            manoSuited ='';
            if (manoJugador.indexOf('s') > -1)
                manoSuited = 'Suited';
            if (manoJugador.indexOf('o') > -1)
                manoSuited = 'Offsuited'
            mensaje = mensaje.replace('\n', '');
            console.log(manoJugador);
            //Posición
            posicionJugador = mensaje.substring(mensaje.indexOf('POSICIÓN:'), mensaje.indexOf('\n'));
            mensaje = mensaje.replace(posicionJugador, '');
            posicionJugador = posicionJugador.replace('POSICIÓN:', '').trim();
            if(posicionJugador == 'BU' || posicionJugador == 'BT' || posicionJugador == 'BUT' || posicionJugador == 'BUTT'){
                posicionJugador = 'BTN';
            }
            mensaje = mensaje.replace('\n', '');
            console.log(posicionJugador);
            //Posición villano
            posicionVillano = mensaje.substring(mensaje.indexOf('POSICIÓN VILLANO:'), mensaje.indexOf('\n'));
            mensaje = mensaje.replace(posicionVillano, '');
            posicionVillano = posicionVillano.replace('POSICIÓN VILLANO:', '').trim();
            //posicionVillano = posicionVillano.substring(0, posicionVillano.indexOf('('));
            if(posicionVillano == 'BU' || posicionVillano == 'BT' || posicionVillano == 'BUT' || posicionVillano == 'BUTT'){
                posicionVillano = 'BTN';
            }
            mensaje = mensaje.replace('\n', '');
            console.log(posicionVillano);
            //Iniciativa
            iniciativa = mensaje.substring(mensaje.indexOf('CON/SIN INICIATIVA:'), mensaje.indexOf('\n'));
            mensaje = mensaje.replace(iniciativa, '');
            iniciativa = iniciativa.replace('CON/SIN INICIATIVA:', '').trim();
            if (iniciativa == 'CON');
            iniciativa = 'Con iniciativa';
            if (iniciativa == 'SIN')
                iniciativa = 'Sin iniciativa';
            mensaje = mensaje.replace('\n', '');
            console.log(iniciativa);
            //Stack Efectivo
            stackEfectivo = mensaje.substring(mensaje.indexOf('STACK EFECTIVO:'), mensaje.indexOf('\n'));
            mensaje = mensaje.replace(stackEfectivo, '');
            stackEfectivo = stackEfectivo.replace('STACK EFECTIVO:', '').trim();
            if (stackEfectivo.indexOf('b') > -1)
                stackEfectivo = stackEfectivo.substring(0, stackEfectivo.indexOf('b'));
            if (stackEfectivo.indexOf('B') > -1)
                stackEfectivo = stackEfectivo.substring(0, stackEfectivo.indexOf('B'));
            mensaje = mensaje.replace('\n', '');
            console.log(stackEfectivo);

            
            //Posicion
            posicion = '';
            numMax = '3';
            var spot = '';
            
            if(mensaje.indexOf('SPOT') > -1 && mensaje.indexOf('SPOT') < 20){
                posicion = getPositionCash(posicionJugador, posicionVillano);
                spot = mensaje.substring(mensaje.indexOf('SPOT: '), mensaje.indexOf('\n'));
                spot = spot.replace('SPOT:', '').trim();
                if(spot == "HU"){
                    numActivos = '2';
                }else if(spot == "3H"){
                    numActivos = '3';
                }else{
                    numActivos = '2';
                }
                mensaje = mensaje.replace('SPOT: '+spot, '');
                mensaje = mensaje.replace('\n', '');
                console.log(numActivos);
                
            }

            if (canalesCash.includes(reaction.message.channel.id)) {
                posicion = getPositionCash(posicionJugador, posicionVillano);
                numActivos = '2';
                numMax = '6';
            }

            if (canalesMTT.includes(reaction.message.channel.id)) {
                posicion = 'OOP';
                numActivos = '2';
                numMax = '9';
            }
            console.log(posicion);

          
            mensaje = mensaje.replace('PLANTEAMIENTO:', '');
            console.log(mensaje);

        }else{
            return;
        }



        //Buscamos los 10 últimos mensajes y
        reaction.message.channel.messages.fetch({ limit: 10 }).then(messages => {
            for (message of messages) {
                
                //Buscamos respuestas que se hayan hecho al mensaje que queremos y que lo haya hecho el coach que ha reaccionado
                if (message[1].reference != null && message[1].author.id == coachID && message[1].reference.messageId == msjManoID) {
                    console.log("Encontrada la referencia");
                    //console.log("Resolución: " + message[1].content);
                    resolucion = message[1].content;
                    resolucion = resolucion.replace('Hola.', '');
                    resolucion = resolucion.replace('Hola', '');
                    resolucion = resolucion.replace('Nueva mano!', '');
                    resolucion = resolucion.replace('Nueva mano', '');
                    resolucion = resolucion.replace(/(?:\r\n|\r|\n)/g, '</p><p>');
                    resolucion = resolucion.replaceAll('<p></p><p></p>', '<p></p>');
                    resolucion = '<p>' + resolucion + '</p>';
                    resolucion = resolucion.replaceAll("'", "´");
                    console.log("Resolución: " + resolucion)
                    break;
                }

            }
            if (resolucion == "") {
                return;
            }


            if (adjunto != null && adjunto != "") {
                console.log()
                tieneAdjunto = true;
                download(adjunto, 'mano.png', function () {


                    //Inicio Queries
                    //Insertamos la mano padre
                    createQuery("INSERT INTO naw_posts (POST_AUTHOR, POST_DATE, POST_DATE_GMT, POST_CONTENT, POST_TITLE, POST_STATUS, COMMENT_STATUS, PING_STATUS, POST_NAME, POST_MODIFIED, POST_MODIFIED_GMT, POST_PARENT, GUID, MENU_ORDER, POST_TYPE, COMMENT_COUNT) VALUES (2375, NOW(), UTC_TIMESTAMP(), '" + mensaje + "', '" + tituloMano + "', 'publish', 'open', 'closed', '" + tituloTagMano + "', NOW(), UTC_TIMESTAMP(), 0, '', 0, 'mano', 0)", function (res) {
                        if (res != "error") {
                            console.log('Mano insertada');
                            idParent = res.insertId;
                            var pathMano = getPathMano(idParent);

                            ftp.auth("mentobot@mentopoker.com", "]1i1qm@3h#^#", (err, data) => {
                                fs.readFile("mano.png", "binary", function (err, data) {
                                    var buffer = new Buffer(data, "binary");
                                    ftp.put(buffer, pathMano, err => {
                                    });
                                });
                            });

                            //Modificamos para cambiar el enlace y que apunte a si mismo
                            createQuery("UPDATE naw_posts SET POST_TITLE = '" + tituloMano + "', POST_NAME = '" + tituloTagMano + "', GUID = 'https://mentopoker.com/?post_type=mano&#038;p=" + idParent + "' WHERE ID=" + idParent, function (res) {
                                if (res != "error") {
                                    console.log('Mano actualizada');

                                    //Insertamos el hijo, en la misma tabla, y con la referencia al padre. El hijo es el que lleva la captura
                                    createQuery("INSERT INTO naw_posts (POST_AUTHOR, POST_DATE, POST_DATE_GMT, POST_TITLE, POST_STATUS, COMMENT_STATUS, PING_STATUS, POST_NAME, POST_MODIFIED, POST_MODIFIED_GMT, POST_PARENT, GUID, MENU_ORDER, POST_TYPE, POST_MIME_TYPE, COMMENT_COUNT) VALUES (2375, NOW(), UTC_TIMESTAMP(), '" + tituloMano + "', 'inherit', 'open', 'closed', '" + tituloTagMano + "', NOW(), UTC_TIMESTAMP(), '" + idParent + "', '" + pathMano + "', 0, 'attachment', 'image/png', 0)", function (res) {
                                        if (res != "error") {
                                            console.log('Captura (post hijo) actualizada');
                                            var idHijo = res.insertId;

                                            //Insertamos los datos de SEO y mierda similar. Pero también es donde lleva la respuesta del profesor
                                            createQuery("INSERT INTO naw_postmeta (POST_ID, META_KEY, META_VALUE) VALUES (" + idParent + ", 'wysiwyg_Resolucion_mano', '" + resolucion + "')", function (res) {
                                                if (res != "error") {
                                                    console.log('Resolución insertada');



                                                } else {
                                                    console.log(res);
                                                }
                                            });

                                            scriptPostmeta(idParent, idHijo, reaction.message.channel.id);

                                        } else {
                                            console.log(res);
                                        }
                                    });
                                } else {
                                    console.log(res);
                                }
                            });
                        } else {
                            console.log(res);
                        }


                    });

                    //Fin Queries

                });
            }

            let idParent;


        })
            .catch(console.error);
    })
        .catch(console.error);








});

function getPathMano(idParent) {
    var fecha = new Date();
    var year = fecha.getFullYear();
    var month = parseInt(fecha.getMonth() + 1);

    if (month < 10)
        month = '0' + month;

    return "/mentopoker.com/public_html/wp-content/uploads/" + year + "/" + month + "/mano" + idParent + ".png";
}

async function download(uri, filename, callback) {
    request.head(uri, function (err, res, body) {
        console.log('content-type:', res.headers['content-type']);
        console.log('content-length:', res.headers['content-length']);

        request(uri).pipe(fs.createWriteStream(filename)).on('close', callback);
    });
};

//Funcion de llenado
function scriptPostmeta(idParent, idHijo, canalMensaje) {
    var roles = getMetadatosCanal(canalMensaje);
    createQuery("INSERT INTO naw_postmeta (POST_ID, META_KEY, META_VALUE) VALUES (" + idParent + ", 'affwp_affiliate_submission_forms', '')", function (res) { });
    createQuery("INSERT INTO naw_postmeta (POST_ID, META_KEY, META_VALUE) VALUES (" + idParent + ", '_edit_lock', '')", function (res) { });
    createQuery("INSERT INTO naw_postmeta (POST_ID, META_KEY, META_VALUE) VALUES (" + idParent + ", '_seopress_analysis_data', '')", function (res) { });
    createQuery("INSERT INTO naw_postmeta (POST_ID, META_KEY, META_VALUE) VALUES (" + idParent + ", '_edit_last', '2375')", function (res) { });
    createQuery("INSERT INTO naw_postmeta (POST_ID, META_KEY, META_VALUE) VALUES (" + idParent + ", 'mano_inicial_text', '"+manoJugador+"')", function (res) { });
    createQuery("INSERT INTO naw_postmeta (POST_ID, META_KEY, META_VALUE) VALUES (" + idParent + ", 'rcp_subscription_level', 'any')", function (res) { });
    createQuery("INSERT INTO naw_postmeta (POST_ID, META_KEY, META_VALUE) VALUES (" + idParent + ", 'rcp_user_level', '" + roles + "')", function (res) { });
    createQuery("INSERT INTO naw_postmeta (POST_ID, META_KEY, META_VALUE) VALUES (" + idParent + ", '_seopress_titles_title', '')", function (res) { });
    createQuery("INSERT INTO naw_postmeta (POST_ID, META_KEY, META_VALUE) VALUES (" + idParent + ", '_seopress_titles_desc', '')", function (res) { });
    createQuery("INSERT INTO naw_postmeta (POST_ID, META_KEY, META_VALUE) VALUES (" + idParent + ", '_seopress_robots_canonical', '')", function (res) { });
    createQuery("INSERT INTO naw_postmeta (POST_ID, META_KEY, META_VALUE) VALUES (" + idParent + ", '_seopress_robots_breadcrumbs', '')", function (res) { });
    createQuery("INSERT INTO naw_postmeta (POST_ID, META_KEY, META_VALUE) VALUES (" + idParent + ", '_seopress_social_fb_title', '')", function (res) { });
    createQuery("INSERT INTO naw_postmeta (POST_ID, META_KEY, META_VALUE) VALUES (" + idParent + ", '_seopress_social_fb_desc', '')", function (res) { });
    createQuery("INSERT INTO naw_postmeta (POST_ID, META_KEY, META_VALUE) VALUES (" + idParent + ", '_seopress_social_fb_img', '')", function (res) { });
    createQuery("INSERT INTO naw_postmeta (POST_ID, META_KEY, META_VALUE) VALUES (" + idParent + ", '_seopress_social_fb_img_attachment_id', '')", function (res) { });
    createQuery("INSERT INTO naw_postmeta (POST_ID, META_KEY, META_VALUE) VALUES (" + idParent + ", '_seopress_social_fb_img_width', '')", function (res) { });
    createQuery("INSERT INTO naw_postmeta (POST_ID, META_KEY, META_VALUE) VALUES (" + idParent + ", '_seopress_social_fb_img_height', '')", function (res) { });
    createQuery("INSERT INTO naw_postmeta (POST_ID, META_KEY, META_VALUE) VALUES (" + idParent + ", '_seopress_social_twitter_title', '')", function (res) { });
    createQuery("INSERT INTO naw_postmeta (POST_ID, META_KEY, META_VALUE) VALUES (" + idParent + ", '_seopress_social_twitter_desc', '')", function (res) { });
    createQuery("INSERT INTO naw_postmeta (POST_ID, META_KEY, META_VALUE) VALUES (" + idParent + ", '_seopress_social_twitter_img', '')", function (res) { });
    createQuery("INSERT INTO naw_postmeta (POST_ID, META_KEY, META_VALUE) VALUES (" + idParent + ", '_seopress_social_twitter_img_attachment_id', '')", function (res) { });
    createQuery("INSERT INTO naw_postmeta (POST_ID, META_KEY, META_VALUE) VALUES (" + idParent + ", '_seopress_social_twitter_img_width', '')", function (res) { });
    createQuery("INSERT INTO naw_postmeta (POST_ID, META_KEY, META_VALUE) VALUES (" + idParent + ", '_seopress_social_twitter_img_height', '')", function (res) { });
    createQuery("INSERT INTO naw_postmeta (POST_ID, META_KEY, META_VALUE) VALUES (" + idParent + ", '_seopress_redirections_type', '')", function (res) { });
    createQuery("INSERT INTO naw_postmeta (POST_ID, META_KEY, META_VALUE) VALUES (" + idParent + ", '_seopress_redirections_value', '')", function (res) { });
    createQuery("INSERT INTO naw_postmeta (POST_ID, META_KEY, META_VALUE) VALUES (" + idParent + ", '_seopress_redirections_logged_status', '')", function (res) { });
    createQuery("INSERT INTO naw_postmeta (POST_ID, META_KEY, META_VALUE) VALUES (" + idParent + ", '_seopress_analysis_data_oxygen', '')", function (res) { });
    createQuery("INSERT INTO naw_postmeta (POST_ID, META_KEY, META_VALUE) VALUES (" + idParent + ", '_thumbnail_id', " + idHijo + ")", function (res) { });
    createQuery("INSERT INTO naw_postmeta (POST_ID, META_KEY, META_VALUE) VALUES (" + idParent + ", 'checkbox_list_tu_posicion', '" + posicionJugador + "')", function (res) { });
    createQuery("INSERT INTO naw_postmeta (POST_ID, META_KEY, META_VALUE) VALUES (" + idParent + ", 'checkbox_list_posición_villano','" + posicionVillano + "')", function (res) { });
    createQuery("INSERT INTO naw_postmeta (POST_ID, META_KEY, META_VALUE) VALUES (" + idParent + ", 'checkbox_list_en_posicion', '" + posicion + "')", function (res) { });
    createQuery("INSERT INTO naw_postmeta (POST_ID, META_KEY, META_VALUE) VALUES (" + idParent + ", 'checkbox_list_iniciativa', '" + iniciativa + "')", function (res) { });
    createQuery("INSERT INTO naw_postmeta (POST_ID, META_KEY, META_VALUE) VALUES (" + idParent + ", '_seopress_analysis_target_kw', '')", function (res) { });
    createQuery("INSERT INTO naw_postmeta (POST_ID, META_KEY, META_VALUE) VALUES (" + idParent + ", 'number_jugadores_activos', '" + numActivos + "')", function (res) { });
    createQuery("INSERT INTO naw_postmeta (POST_ID, META_KEY, META_VALUE) VALUES (" + idParent + ", 'number_jugadores', '" + numMax + "')", function (res) { });
    createQuery("INSERT INTO naw_postmeta (POST_ID, META_KEY, META_VALUE) VALUES (" + idParent + ", 'ciegas_efectivas_number', '" + stackEfectivo + "')", function (res) { });
    createQuery("INSERT INTO naw_postmeta (POST_ID, META_KEY, META_VALUE) VALUES (" + idParent + ", 'checkbox_list_tipo_de_manoo', '" + manoSuited + "')", function (res) { });

    //Insertamos categorias
    insertCategorias(idParent, canalMensaje);

    createQuery("INSERT INTO naw_postmeta (POST_ID, META_KEY, META_VALUE) VALUES (" + idHijo + ", '_wp_attachment_image_alt', 'Mano" + idParent + "')", function (res) { });
    createQuery("INSERT INTO naw_postmeta (POST_ID, META_KEY, META_VALUE) VALUES (" + idHijo + ", '_wp_old_slug', 'Mano" + idParent + "')", function (res) { });
    createQuery("INSERT INTO naw_postmeta (POST_ID, META_KEY, META_VALUE) VALUES (" + idHijo + ", '_edit_lock', '1661457461:2375')", function (res) { });
    createQuery("INSERT INTO naw_postmeta (POST_ID, META_KEY, META_VALUE) VALUES (" + idHijo + ", '_shortpixel_was_converted', '1655903459')", function (res) { });
    createQuery("INSERT INTO naw_postmeta (POST_ID, META_KEY, META_VALUE) VALUES (" + idHijo + ", '_wp_attachment_metadata', '" + getMetadatos(idParent) + "')", function (res) { });
    var manoAttch = getPathMano(idParent).split('/uploads/')[1];
    createQuery("INSERT INTO naw_postmeta (POST_ID, META_KEY, META_VALUE) VALUES (" + idHijo + ", '_wp_attached_file', '" + manoAttch + "')", function (res) { });

    var extra_info1 = '{"wasConverted":true,"did_keepExif":false,"did_cmyk2rgb":false,"did_png2jpg":false,"tried_png2jpg":false,"originalWidth":1843,"originalHeight":790,"webp":"Captura_de_pantalla_2022-03-10_233211.webp","avif":"Captura_de_pantalla_2022-03-10_233211.avif"}';
    createQuery("INSERT INTO naw_shortpixel_postmeta (attach_id, parent, image_type, size, status, compression_type, compressed_size, original_size, tsAdded, tsOptimized, extra_info) VALUES (" + idHijo + ", 0, 0, null, 2, 1, 186691, 528849, NOW(), NOW(), '" + extra_info1 + "')", function (res) { });
    var extra_info2 = '{"did_keepExif":false,"did_cmyk2rgb":false,"did_png2jpg":false,"tried_png2jpg":false,"originalWidth":300,"originalHeight":129,"webp":"Captura_de_pantalla_2022-03-10_233211-300x129.webp","avif":"Captura_de_pantalla_2022-03-10_233211-300x129.avif"}';
    createQuery("INSERT INTO naw_shortpixel_postmeta (attach_id, parent, image_type, size, status, compression_type, compressed_size, original_size, tsAdded, tsOptimized, extra_info) VALUES (" + idHijo + ", " + idHijo + ", 1, 'medium', 2, 1, 11039, 35839, NOW(), NOW(), '" + extra_info2 + "')", function (res) { });
    var extra_info3 = '{"did_keepExif":false,"did_cmyk2rgb":false,"did_png2jpg":false,"tried_png2jpg":false,"originalWidth":1024,"originalHeight":439,"webp":"Captura_de_pantalla_2022-03-10_233211-1024x439.webp","avif":"Captura_de_pantalla_2022-03-10_233211-1024x439.avif"}';
    createQuery("INSERT INTO naw_shortpixel_postmeta (attach_id, parent, image_type, size, status, compression_type, compressed_size, original_size, tsAdded, tsOptimized, extra_info) VALUES (" + idHijo + ", " + idHijo + ", 1, 'large', 2, 1, 114651, 313107, NOW(), NOW(), '" + extra_info3 + "')", function (res) { });
    var extra_info4 = '{"did_keepExif":false,"did_cmyk2rgb":false,"did_png2jpg":false,"tried_png2jpg":false,"originalWidth":150,"originalHeight":150,"webp":"Captura_de_pantalla_2022-03-10_233211-150x150.webp","avif":"Captura_de_pantalla_2022-03-10_233211-150x150.avif"}';
    createQuery("INSERT INTO naw_shortpixel_postmeta (attach_id, parent, image_type, size, status, compression_type, compressed_size, original_size, tsAdded, tsOptimized, extra_info) VALUES (" + idHijo + ", " + idHijo + ", 1, 'thumbnail', 2, 1, 7902, 24125, NOW(), NOW(), '" + extra_info4 + "')", function (res) { });
    var extra_info5 = '{"did_keepExif":false,"did_cmyk2rgb":false,"did_png2jpg":false,"tried_png2jpg":false,"originalWidth":768,"originalHeight":329,"webp":"Captura_de_pantalla_2022-03-10_233211-768x329.webp","avif":"Captura_de_pantalla_2022-03-10_233211-768x329.avif"}';
    createQuery("INSERT INTO naw_shortpixel_postmeta (attach_id, parent, image_type, size, status, compression_type, compressed_size, original_size, tsAdded, tsOptimized, extra_info) VALUES (" + idHijo + ", " + idHijo + ", 1, 'medium_large', 2, 1, 69239, 193100, NOW(), NOW(), '" + extra_info5 + "')", function (res) { });
    var extra_info6 = '{"did_keepExif":false,"did_cmyk2rgb":false,"did_png2jpg":false,"tried_png2jpg":false,"originalWidth":1536,"originalHeight":658,"webp":"Captura_de_pantalla_2022-03-10_233211-1536x658.webp","avif":"Captura_de_pantalla_2022-03-10_233211-1536x658.avif"}';
    createQuery("INSERT INTO naw_shortpixel_postmeta (attach_id, parent, image_type, size, status, compression_type, compressed_size, original_size, tsAdded, tsOptimized, extra_info) VALUES (" + idHijo + ", " + idHijo + ", 1, '1536x1536', 2, 1, 233601, 619853, NOW(), NOW(), '" + extra_info6 + "')", function (res) { });
    var extra_info7 = '{"did_keepExif":false,"did_cmyk2rgb":false,"did_png2jpg":false,"tried_png2jpg":false,"originalWidth":42,"originalHeight":0,"webp":"Captura_de_pantalla_2022-03-10_233211-wpgb-lqip.webp","avif":"Captura_de_pantalla_2022-03-10_233211-wpgb-lqip.avif"}';
    createQuery("INSERT INTO naw_shortpixel_postmeta (attach_id, parent, image_type, size, status, compression_type, compressed_size, original_size, tsAdded, tsOptimized, extra_info) VALUES (" + idHijo + ", " + idHijo + ", 1, 'wpgb-lqip', 2, 1, 424, 1340, NOW(), NOW(), '" + extra_info7 + "')", function (res) { });
}

function getMetadatos(idParent) {
    var metadatos = 'a:7:{s:5:"width";i:1843;s:6:"height";i:790;s:4:"file";s:49:"2022/04/mano.png";s:5:"sizes";a:6:{s:6:"medium";a:4:{s:4:"file";s:49:"mano-300x129.png";s:5:"width";i:300;s:6:"height";i:129;s:9:"mime-type";s:9:"image/png";}s:5:"large";a:4:{s:4:"file";s:50:"mano-1024x439.png";s:5:"width";i:1024;s:6:"height";i:439;s:9:"mime-type";s:9:"image/png";}s:9:"thumbnail";a:4:{s:4:"file";s:49:"mano-150x150.png";s:5:"width";i:150;s:6:"height";i:150;s:9:"mime-type";s:9:"image/png";}s:12:"medium_large";a:4:{s:4:"file";s:49:"mano-768x329.png";s:5:"width";i:768;s:6:"height";i:329;s:9:"mime-type";s:9:"image/png";}s:9:"1536x1536";a:4:{s:4:"file";s:50:"mano-1536x658.png";s:5:"width";i:1536;s:6:"height";i:658;s:9:"mime-type";s:9:"image/png";}s:9:"wpgb-lqip";a:4:{s:4:"file";s:51:"mano-wpgb-lqip.jpg";s:5:"width";i:42;s:6:"height";i:0;s:9:"mime-type";s:10:"image/jpeg";}}s:10:"image_meta";a:12:{s:8:"aperture";s:1:"0";s:6:"credit";s:0:"";s:6:"camera";s:0:"";s:7:"caption";s:0:"";s:17:"created_timestamp";s:1:"0";s:9:"copyright";s:0:"";s:12:"focal_length";s:1:"0";s:3:"iso";s:1:"0";s:13:"shutter_speed";s:1:"0";s:5:"title";s:0:"";s:11:"orientation";s:1:"0";s:8:"keywords";a:0:{}}s:10:"ShortPixel";a:7:{s:4:"type";s:5:"lossy";s:8:"exifKept";s:1:"0";s:4:"date";s:19:"2022-05-24 13:38:17";s:9:"thumbsOpt";i:6;s:13:"thumbsOptList";a:6:{i:0;s:49:"mano-300x129.png";i:1;s:50:"mano-1024x439.png";i:2;s:49:"mano-150x150.png";i:3;s:49:"mano-768x329.png";i:4;s:50:"mano-1536x658.png";i:5;s:51:"mano-wpgb-lqip.jpg";}s:12:"excludeSizes";a:0:{}s:10:"retinasOpt";i:0;}s:21:"ShortPixelImprovement";s:5:"63.67";}'.replaceAll('mano', 'mano' + idParent);
    return metadatos;
}

function getPositionSpins(posJ, posV) {
    if (posJ == 'BTN' || posV == 'SB') {
        return 'IP';
    }
    if (posV == 'BTN' || posJ == 'SB') {
        return 'OOP';
    }

}

function getPositionCash(posJ, posV) {
    if (posJ == 'BTN' || posV == 'SB') {
        return 'IP';
    }
    if (posV == 'BTN' || posJ == 'SB') {
        return 'OOP';
    }
    if (posV == 'UTG' && (posJ == 'HJ' || posJ == 'CO')) {
        return 'IP';
    }
    if (posV == 'HJ' && posJ == 'CO') {
        return 'IP'
    }
    if (posV == 'BB' && (posJ == 'CO' || posJ == 'UTG' || posJ == 'HJ')) {
        return 'IP';
    }

    if (posJ == 'UTG' && (posV == 'HJ' || posV == 'CO')) {
        return 'OOP';
    }
    if (posJ == 'HJ' && posV == 'CO') {
        return 'OOP'
    }
    if (posJ == 'BB' && (posV == 'CO' || posV == 'UTG' || posV == 'HJ')) {
        return 'OOP';
    }


}

function insertCategorias(idParent, canalMensaje){
    switch (canalMensaje) {
        case '653267901628940349':
            createQuery("INSERT INTO naw_term_relationships (object_id, term_taxonomy_id, term_order) VALUES (" + idParent + ", '9', '0')", function (res) { });
            createQuery("INSERT INTO naw_term_relationships (object_id, term_taxonomy_id, term_order) VALUES (" + idParent + ", '12', '0')", function (res) { });
            break;
        case '653267606618505229':
            createQuery("INSERT INTO naw_term_relationships (object_id, term_taxonomy_id, term_order) VALUES (" + idParent + ", '9', '0')", function (res) { });
            createQuery("INSERT INTO naw_term_relationships (object_id, term_taxonomy_id, term_order) VALUES (" + idParent + ", '13', '0')", function (res) { });
            
            break;
        case '653267723953897522':
            createQuery("INSERT INTO naw_term_relationships (object_id, term_taxonomy_id, term_order) VALUES (" + idParent + ", '9', '0')", function (res) { });
            createQuery("INSERT INTO naw_term_relationships (object_id, term_taxonomy_id, term_order) VALUES (" + idParent + ", '14', '0')", function (res) { });
            break;
        case '804029265523376158':
            createQuery("INSERT INTO naw_term_relationships (object_id, term_taxonomy_id, term_order) VALUES (" + idParent + ", '10', '0')", function (res) { });
            createQuery("INSERT INTO naw_term_relationships (object_id, term_taxonomy_id, term_order) VALUES (" + idParent + ", '17', '0')", function (res) { });
            break;
        case '655925523242942474':
            createQuery("INSERT INTO naw_term_relationships (object_id, term_taxonomy_id, term_order) VALUES (" + idParent + ", '10', '0')", function (res) { });
            createQuery("INSERT INTO naw_term_relationships (object_id, term_taxonomy_id, term_order) VALUES (" + idParent + ", '18', '0')", function (res) { });
            break;
        case '655925718508634122':
            createQuery("INSERT INTO naw_term_relationships (object_id, term_taxonomy_id, term_order) VALUES (" + idParent + ", '10', '0')", function (res) { });
            createQuery("INSERT INTO naw_term_relationships (object_id, term_taxonomy_id, term_order) VALUES (" + idParent + ", '19', '0')", function (res) { });
            break;
        case '674581131085217812':
            createQuery("INSERT INTO naw_term_relationships (object_id, term_taxonomy_id, term_order) VALUES (" + idParent + ", '11', '0')", function (res) { });
            createQuery("INSERT INTO naw_term_relationships (object_id, term_taxonomy_id, term_order) VALUES (" + idParent + ", '15', '0')", function (res) { });
            break;
        case '674581229710082061':
            createQuery("INSERT INTO naw_term_relationships (object_id, term_taxonomy_id, term_order) VALUES (" + idParent + ", '11', '0')", function (res) { });
            createQuery("INSERT INTO naw_term_relationships (object_id, term_taxonomy_id, term_order) VALUES (" + idParent + ", '16', '0')", function (res) { });
            break;
    }
}

function getMetadatosCanal(canalMensaje) {
    var metadatos;
    //['653267901628940349', '653267606618505229', '653267723953897522', '804029265523376158', '655925523242942474', '655925718508634122', '674581131085217812', '674581229710082061']
    switch (canalMensaje) {
        case '653267901628940349':
            metadatos = 'a:1:{i:0;s:10:"spin_basic";}';
            break;
        case '653267606618505229':
            metadatos = 'a:1:{i:0;s:10:"spin_pro";}';
            break;
        case '653267723953897522':
            metadatos = 'a:1:{i:0;s:10:"spin_elite";}';
            break;
        case '804029265523376158':
            metadatos = 'a:1:{i:1;s:10:"cash_basic";}';
            break;
        case '655925523242942474':
            metadatos = 'a:1:{i:1;s:10:"cash_pro";}';
            break;
        case '655925718508634122':
            metadatos = 'a:1:{i:1;s:10:"cash_elite";}';
            break;
        case '674581131085217812':
            metadatos = 'a:1:{i:1;s:10:"mtt_basic";}';
            break;
        case '674581229710082061':
            metadatos = 'a:1:{i:1;s:10:"mtt_pro";}';
            break;
    }

    return metadatos;

}

client.on('messageCreate', message => {

    /*if(message.attachments.size > 0){
    
    download(message.attachments.first()["url"], 'mano.png', function(){
        imgur.setClientID(clientIdImgur);
     imgur.upload('mano.png',function(err, res){
         console.log(res.data.link); //log the imgur url
     });
    });
   

     
}*/

});







client.login(token);