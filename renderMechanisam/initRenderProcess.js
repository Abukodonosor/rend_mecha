'use strict';

let request = require('request');
let config = require('../config');

let ip = config.server.ip;
let port = config.server.port;

let aebinary = config.renderingProcesses.aebinary;

const renderer  = require('../renderMechanisam/nexrender/index').renderer;
const Project  = require('../renderMechanisam/nexrender/index').Project;
const RenderHistory = require('./DBhistory');

const http      = require('http');
const url       = require('url');
const path      = require('path');
const fs        = require('fs');

module.exports = {

    //geting init number of aerender isntaces
    availablePorts: () => {
        return new Promise((resolve)=>{
            request.get(ip+port+'/renderServer/aerenderProcesses',[],(err,res,body)=>{
                let ports = JSON.parse(body).port;
                resolve(ports);
            });
        });
    },

    //receive scene from api
    getScene:() => {
        return new Promise((resolve)=>{
            request.post(ip+port+'/renderServer/getNextScene',[],(err,res,body)=>{
                resolve(body);
            });
        });
    },

    //peek scene from api
    peekScene:() => {
        return new Promise((resolve)=>{
            request.post(ip+port+'/renderServer/peekNextScene',[],(err,res,body)=>{
                resolve(body);
            });
        });
    },

    //aerender node
    renderNode:(port,project,callback) => {

        /**
         * HTTP server
         */
        let server = http.createServer((req, res) => {

            let uri         = url.parse(req.url).pathname;
            let filename    = path.join(process.cwd(), uri);

            fs.exists(filename, (exists) => {
                if(!exists) {
                    res.writeHead(404, {"Content-Type": "text/plain"});
                    res.write("404 Not Found\n");

                    return res.end();
                }
                fs.readFile(filename, "binary", function(err, file) {
                    if(err) {
                        res.writeHead(500, {"Content-Type": "text/plain"});
                        res.write(err + "\n");
                        return res.end();
                    }
                    // send 200
                    res.writeHead(200);
                    res.write(file, "binary");
                    return res.end();
                });
            });
        });

        /**
         * Renderer
         */
        server.listen(port, () => {

            console.log('Started local static server at port:', port);

            let obj = JSON.parse(project);
            let project1 = new Project(obj);

            changePort(project1.assets,port);
            console.log(project1.assets);
            // start rendering
            renderer.render(aebinary, project1).then(() => {
                // success
                request.post({
                    url: config.server.ip+config.server.port+'/renderServer/mergeVideoControll',
                    form: {status: "done", obj:  JSON.stringify(project1.full_object) }
                },function(err,res,body){
                    console.log('rendering finished');
                    server.close();
                    callback(port);
                    // return false;
                });
            }).catch((err) => {
                // error
                request.post({
                    url: config.server.ip+config.server.port+'/renderServer/mergeVideoControll',
                    form: {status: "broken", obj: JSON.stringify(project1.full_object) }
                },function(err,res,body){
                    console.error(err);
                    server.close();
                    callback(port);

                    /*
                    slack notification of broken template
                    BrokenOrderUpdate(project1, lastThing => {
                        server.close();
                        callback(port);
                    });
                    */
                    // return false;
                });
            });
        });
    }

};

function changePort(list,port){
    for(let obj of list){
        obj.src = obj.src.replace("___",port);
    }
}

function BrokenOrderUpdate(obj,end){

    const IncomingWebhook = require('@slack/client').IncomingWebhook;
    const url = 'https://hooks.slack.com/services/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';
    const webhook = new IncomingWebhook(url);
    let message = "Broken template or assets !!    ";
        message += `OrderId: ${obj.full_object.OrderId}\n
                    ServerIP: ${config.server.ip}`;

    webhook.send(message, function (err, res) {
        if (err) {
            console.log('Error:', err);
        } else {
            console.log('Message sent: ');
        }

        /* add warrning about broken  tempalte and order  */
        RenderHistory.updateHistory(obj, "broken", {}, callback => {
            end(callback);
            return false;
        });
    });

}
