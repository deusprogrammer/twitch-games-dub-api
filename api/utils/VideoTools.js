import Videos from "../models/videos";
import ffmpeg from 'fluent-ffmpeg';
import JSZip from 'jszip';
import fs from 'fs';
import axios from 'axios';

const ffmpegPath = require('@ffmpeg-installer/ffmpeg').path;
ffmpeg.setFfmpegPath(ffmpegPath);

const GAME_DATA_BASE = '/var/game-data';

function uuidv4() {
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
        var r = Math.random() * 16 | 0, v = c == 'x' ? r : (r & 0x3 | 0x8);
        return v.toString(16);
    });
}

export let writeFile = (filePath, byteStream) => {
    return new Promise((resolve, reject) => {
        fs.writeFile(filePath, byteStream, (err) => {
            if (err) {
                return reject(err);
            }

            return resolve();
        })
    });
}

export let readFile = (filePath) => {
    return new Promise((resolve, reject) => {
        fs.readFile(filePath, (err, data) => {
            if (err) {
                return reject(err);
            }

            return resolve(data);
        })
    })
}

let convertSecondsToTimestamp = (seconds) => {
    let h = Math.floor(seconds / 3600);
    let m = Math.floor((seconds % 3600) / 60);
    let s = Math.floor(seconds % 60);
    let ms = Math.floor((seconds - Math.trunc(seconds)) * 1000);

    return `${h.toString().padStart(2, "0")}:${m.toString().padStart(2, "0")}:${s.toString().padStart(2, "0")},${ms.toString().padStart(3, "0")}`;
}

export let storeVideo = async (name, videoUrl, twitchUserId, subtitles) => {
    //var videoPath = `${GAME_DATA_BASE}/videos/${uuidv4()}.mp4`;

    try {
        return await Videos.create({
            name,
            videoUrl,
            twitchUserId,
            subtitles
        });
    } catch (error) {
        throw new Error("Unable to create entr: " + error);
    }
}

// let processVideo = (inputFilePath, outputFilePath, startTime, duration) => {
//     return new Promise((resolve, reject) => {
//         // Process video
//         let ts = convertSecondsToTimestamp(startTime);
//         ffmpeg(inputFilePath)
//             .videoCodec("libx264")
//             .setStartTime(ts.substring(0, ts.indexOf(",")))
//             .setDuration(duration)
//             .output(outputFilePath)
//             .on('end', function(err) {
//                 if(!err) { 
//                     resolve();
//                 }
//             })
//             .on('error', function(err){
//                 reject(err);
//             }).run();
//     });
// }

// export let trimVideo = async (videoByteStream, startTime, endTime) => {
//     var buffer = Buffer.from(videoByteStream, "base64");
//     var inputFilePath = `/tmp/working/${uuidv4()}-in.mp4`;
//     var outputFilePath = `/tmp/working/${uuidv4()}-in.mp4`;
//     try {
//         await writeFile(inputFilePath, buffer);
//         await processVideo(inputFilePath, outputFilePath, startTime, endTime - startTime);
//         return await readFile(outputFilePath);
//     } catch (err) {
//         throw new Error("Unable to trim video: " + err);
//     }
// }

export let convertSubtitlesToSrt = (subtitles) => {
    return subtitles.map((subtitle, index) => {
        return `${index + 1}\n${convertSecondsToTimestamp(subtitle.startTime)} --> ${convertSecondsToTimestamp(subtitle.endTime)}\n${subtitle.text}`;
    }).join("\n\n");
}

export let createPayloadZip = async (byteStream, subtitles) => {
    let zip = new JSZip();
    let root = zip
        .folder("WhatTheDub_Data")
        .folder("StreamingAssets");

    let baseFileName = `${uuidv4()}`;
    
    root
        .folder("Subtitles")
        .file(`${baseFileName}.srt`, convertSubtitlesToSrt(subtitles));
    root
        .folder("VideoClips")
        .file(`${baseFileName}.mp4`, byteStream);

    return `data:application/zip;base64,${await zip.generateAsync({type:"base64"})}`;
}