"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.mergeAudiosIntoVideo = void 0;
const ffmpeg_1 = require("./ffmpeg");
const string_1 = require("./string");
const fs_1 = __importDefault(require("fs"));
const extractAudio = async (baseName, fileContent, silenceDuration) => {
    const ffmpeg = await (0, ffmpeg_1.getFFmpeg)();
    const outputFileName = `${baseName}.${(0, string_1.generateRandomString)(10)}.mp3`;
    const tmpName = "input.mp4";
    const tmpName1 = "input.mp3";
    await fs_1.default.promises.writeFile(tmpName, new Uint8Array(fileContent));
    await new Promise((resolve, reject) => {
        ffmpeg(tmpName)
            .audioCodec('libmp3lame')
            .outputOptions('-q:a', '0')
            .on('end', () => {
            resolve(null);
        })
            .on('error', (err) => {
            reject(err);
        })
            .save(tmpName1);
    });
    await fs_1.default.promises.unlink(tmpName);
    if (silenceDuration > 0) {
        // ffmpeg -i audio1.mp3 -filter_complex "aevalsrc=0:d=5[silence]; [silence][0:a]concat=n=2:v=0:a=1[out]" -map "[out]" audio1.mp3
        await new Promise((resolve, reject) => {
            ffmpeg()
                .input(tmpName1)
                .complexFilter('aevalsrc=0:d=' + silenceDuration + '[silence]; [silence][0:a]concat=n=2:v=0:a=1[out]')
                .map('[out]')
                .outputOptions('-y') // Allow overwrite
                .on('error', function (err) {
                console.error('Error:', err.message);
                reject(err);
            })
                .on('end', function () {
                resolve(undefined);
            })
                .save(outputFileName);
        });
    }
    else {
        await fs_1.default.promises.copyFile(tmpName1, outputFileName);
    }
    await fs_1.default.promises.unlink(tmpName1);
    return outputFileName;
};
const mergeAnAudioIntoVideo = async (baseName, videoFile, audioFile) => {
    const outputFileName = `${baseName}.${(0, string_1.generateRandomString)(10)}.mp4`;
    const ffmpeg = await (0, ffmpeg_1.getFFmpeg)();
    await new Promise((resolve, reject) => {
        // ffmpeg -i video1.mp4 -i audio1.mp3 -c:v copy -c:a aac -strict experimental output.mp4
        ffmpeg()
            .input(videoFile)
            .input(audioFile)
            .videoCodec('copy')
            .audioCodec('aac')
            .audioChannels(2) // Set the number of audio channels if necessary
            .on('error', function (err) {
            console.error('Error:', err.message);
            reject(err);
        })
            .on('end', function () {
            resolve(undefined);
        })
            .save(outputFileName);
    });
    return outputFileName;
};
const mergeAudiosIntoVideo = async (baseName, videoFilePath, audiosInput) => {
    const audioFileNameList = [];
    for (const a of audiosInput) {
        const audioFilePath = await extractAudio(baseName, a.content, a.startFromSecond);
        audioFileNameList.push({
            audioFilePath,
            startFromSecond: a.startFromSecond,
        });
    }
    let tmpVideoFile = videoFilePath;
    for (const { audioFilePath, startFromSecond } of audioFileNameList) {
        const tmp = await mergeAnAudioIntoVideo(baseName, tmpVideoFile, audioFilePath);
        await fs_1.default.promises.unlink(tmpVideoFile);
        await fs_1.default.promises.unlink(audioFilePath);
        tmpVideoFile = tmp;
    }
    await fs_1.default.promises.rename(tmpVideoFile, videoFilePath);
    return true;
};
exports.mergeAudiosIntoVideo = mergeAudiosIntoVideo;
