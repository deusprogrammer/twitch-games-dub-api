const express = require('express');
var router = express.Router();

import {storeVideo, createPayloadZip, readFile} from '../utils/VideoTools';
var Videos = require('../models/videos');

import {authenticatedUserHasRole, getAuthenticatedTwitchUserId} from '../utils/SecurityHelper';

router.route("/")
    .get(async (request, response) => {
        try {
            let videos = [];
            let searchObject = {};

            if (request.query.twitchUserId) {
                searchObject["twitchUserId"] = request.query.twitchUserId;
            } 

            if (request.query.videoName) {
                searchObject["name"] = request.query.videoName;
            }

            videos = await Videos.find(searchObject, null).exec();

            return response.json(videos);
        } catch (error) {
            console.error(error);
            response.status(500);
            return response.send(error);
        }
    })
    .post(async (request, response) => {
        if (!authenticatedUserHasRole(request, "TWITCH_BROADCASTER")) {
            response.status(401);
            return response.send("Forbidden");
        }

        let twitchUserId = getAuthenticatedTwitchUserId(request);

        let buffer = Buffer.from(request.body.videoPayload, "base64");
        
        try {
            let video = await storeVideo(request.body.name, buffer, twitchUserId, request.body.subtitles);
            return response.json(video);
        } catch (error) {
            console.error(error);
            response.status(500);
            return response.send(error);
        }
    });

router.route("/:id")
    .get(async (request, response) => {
        try {
        let video = await Videos.findOne({_id: request.params.id});
        return response.json(video);
        } catch (error) {
            console.error(error);
            response.status(500);
            return response.send(error);
        }
    });

router.route("/:id/mp4")
    .get(async (request, response) => {
        try {
        let video = await Videos.findOne({_id: request.params.id})
        let byteStream = await readFile(video.videoPath);
        response.header("content-type", "video/mp4");
        return response.sendFile(byteStream);
        } catch (error) {
            console.error(error);
            response.status(500);
            return response.send(error);
        }
    });

router.route("/:id/zip")
    .get(async (request, response) => {
        try {
        let video = await Videos.findOne({_id: request.params.id});
        let byteStream = await readFile(video.videoPath);
        let dataUri = await createPayloadZip(byteStream, video.subtitles);
        return response.json({
            dataUri
        });
        } catch (error) {
            console.error(error);
            response.status(500);
            return response.send(error);
        }
    });

module.exports = router;