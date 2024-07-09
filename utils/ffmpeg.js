"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getFFmpeg = void 0;
const ffmpeg_1 = require("@ffmpeg/ffmpeg");
let ffmpeg = undefined;
const getFFmpeg = async () => {
    if (!ffmpeg) {
        ffmpeg = new ffmpeg_1.FFmpeg();
        ffmpeg.on('log', ({ message }) => {
            console.log(message);
        });
        await ffmpeg.load();
    }
    return ffmpeg;
};
exports.getFFmpeg = getFFmpeg;
