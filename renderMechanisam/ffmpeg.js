'use strict';

let config = require('../config');
let spawn = require('child_process').spawn;
var fs = require('fs');
var request = require('request');
const RenderHistory = require('./DBhistory');

var fluent_ffmpeg = require('fluent-ffmpeg');
fluent_ffmpeg.setFfprobePath("C:\\rend_mecha\\ffmpeg\\bin\\ffprobe.exe");
fluent_ffmpeg.setFfmpegPath("C:\\rend_mecha\\ffmpeg\\bin\\ffmpeg.exe");

let pathFromApiToC = "../../..";
let ffmpeg = config.ffmpeg.path;

let pathToResult = config.ffmpeg.resultClips;
let unlinkFile = config.ffmpeg.unlink;

//result path
let finalPathFFmpeg = config.clip_storage.pathToFinalStorage;
let relFinalPathFFmpeg = config.clip_storage.relPathToFinalStorage;

module.exports = {

    runFFmpeg:(obj) => {
        //userID
        let userId = obj.fileName.split("_")[0];
        let resName =  obj.fileName.replace(/ /g,'_') + ".mp4";
        let resImgName = obj.fileName.replace(/ /g,'_') + ".jpg";

        // path to folder where clips are seted
        let realPath = pathToResult+"\\";
        let unlink = unlinkFile+ "\\" + userId + "\\" +obj.OrderId+ "\\" + resName;
        let unlinkImage = unlinkFile+ "\\" + userId + "\\" +obj.OrderId+ "\\" +resImgName;

        let mergeFile = realPath + "\\"  +obj.OrderId+ "\\"  + "mergeFiles.txt";
        let soundFile = realPath + "\\"  +obj.OrderId+ "\\" + "sound.mp3";

        let resultName = relFinalPathFFmpeg+ "\\" + userId+ "\\" + obj.OrderId + "\\" + resName;
        let imageName = relFinalPathFFmpeg+ "\\" + userId+ "\\" + obj.OrderId + "\\" + resImgName;

        //make user folder at C:/inetpub/wwwroot/videos
        console.log(finalPathFFmpeg + "\\"+ userId);
        if (!fs.existsSync(finalPathFFmpeg + "\\"+ userId)){
            fs.mkdirSync(finalPathFFmpeg + "\\"+ userId);
        }

        //make order file if user exist
        if (!fs.existsSync(finalPathFFmpeg+ "\\" + userId+ "\\" + obj.OrderId)){
            fs.mkdirSync(finalPathFFmpeg + "\\" + userId+ "\\" + obj.OrderId);
        }
        //

        //deleting final video
        if(fs.existsSync(unlink)){
            fs.unlinkSync(unlink);
        }
        //deleting final image
        if(fs.existsSync(unlinkImage)){
            fs.unlinkSync(unlinkImage);
        }

        var args = [
            "-f","concat",
            "-safe","0",
            "-i", mergeFile,
            "-i", soundFile,
            "-c:a", "copy", "-shortest", resultName,
            // "-vframes" ,"1", "-q:v", "5", imageName
        ];

        var proc = spawn(ffmpeg, args);

        proc.stdout.on('data', function(data) {
            console.log(data.toString());
        });
        proc.stderr.on('data', function(data) {
            console.log(data.toString());
        });

        proc.on('close', function() {
            console.log('finished');
            //screenshoot maker
            var proc = new fluent_ffmpeg({source: pathFromApiToC+"/inetpub/wwwroot/videos/"+ userId + "/" + obj.OrderId + "/" + resName})
            .takeScreenshots({
                count: 1,
                timemarks: ['50%'],
                size: '639x360',
                filename: pathFromApiToC+"/inetpub/wwwroot/videos/"+ userId + "/" + obj.OrderId + "/" + resImgName
            });

            let response = {
                "id": obj.OrderId+"",
                "video_url": config.server.ip+"/videos/"+userId+"/" + obj.OrderId + "/" + resName,
                "image_url": config.server.ip+"/videos/"+userId+"/" + obj.OrderId + "/" + resImgName,
                "status": "done"
            };
            //send to milan
            RenderHistory.updateHistory(obj, "done", response, callback =>{
                console.log(callback);
                request.post({
                    url: obj.updateVideoUrl+"/api/dataclay/rlo30U8cLn",
                    form: response
                },function(err,res,body){
                    console.log('Send json_response to reevio');
                    console.log(body);

                });
                // return false;
            });


        });

    },

    wirteFFmpegMergeFile:(obj,orderID) => {

        let schema = "file 'C:\\reevio_results\\"+ orderID +"\\";
        let content = "";
        for(let o of obj){
            content += schema + o.uid +"_result.mov'\n";
        }
        fs.writeFileSync(config.ffmpeg.pathForMergeFile+"/"+orderID+"/mergeFiles.txt", content);
    },

    downloadAssetsForFFmpeg:(obj,pathForDownloading) => {
        // list of ffmpeg assets which need to be downloaded
        let arrayOfFFmpegAssetsForDownload = [
            { key: "audioUrl", value: "", extensions: ['.mp3', '.wmw'], name:"sound" },
            { key: "watermark", value: "" , extensions: ['.png'], name:"watermark" },
        ];

        for(let elem of arrayOfFFmpegAssetsForDownload){
            if(obj[elem.key] != ''){
                let itemUrl = obj[elem.key];
                let extension = findRightExtension(itemUrl,elem.extensions);
                download( itemUrl, extension, elem.name, pathForDownloading);
            }
        }
    }
};


// download item and save to his folder
function download(itemUrlextension, extension, name, pathForDownloading){
    request
        .get(itemUrlextension)
        .on('error', function(err) {
            // handle error
        })
        .pipe(fs.createWriteStream(pathForDownloading+name + extension));
}

//find right extension
function findRightExtension( string, extensions){
    for(let ex of extensions){
        if(string.indexOf(ex) != -1)
            return ex;
    }
}



/*

var spawn = require('child_process').spawn;

var cmd = 'C:\\Users\\Abu\\Desktop\\DBLOW test\\ffmpeg\\bin\\ffmpeg';

var args = [
    "-f","concat",
    "-safe","0",
    "-i", "\\ffmpeg\\bin\\vv.txt",
    "-i", "\\ffmpeg\\bin\\sound.mp3",
    "-c:a", "copy", "-shortest",'..\\..\\kraj.mp4'
];

var proc = spawn(cmd, args);

proc.stdout.on('data', function(data) {
    console.log(data.toString());
});

proc.stderr.on('data', function(data) {
    console.log(data.toString());
});

proc.on('close', function() {
    console.log('finished');
});


watermark:
// position :0
    overlay = (W*5)/100:(H*5)/100
// position :1
    overlay = ((W*95)/100)-w:(H*5)/100
// position :2
    overlay = ((W*95)/100)-w:((H*95)/100)-h
// position :3
    overlay = ((W*5)/100):((H*95)/100)-h


* */