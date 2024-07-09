"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.mergeAudiosIntoVideo = void 0;
const ffmpeg_1 = require("./ffmpeg");
const string_1 = require("./string");
const mergeAudiosIntoVideo = async (videoInput, audiosInput) => {
    const ffmpeg = await (0, ffmpeg_1.getFFmpeg)();
    const audioFileNameList = [];
    for (const a of audiosInput) {
        audioFileNameList.push({
            audioFileName: await extractAudio(a.content),
            startFromSecond: a.startFromSecond,
        });
    }
    let tmpVideoFileName = "source.mp4";
    await ffmpeg.writeFile(tmpVideoFileName, videoInput);
    for (const { audioFileName, startFromSecond } of audioFileNameList) {
        const tmp = await mergeAnAudioIntoVideo(tmpVideoFileName, audioFileName, startFromSecond);
        await ffmpeg.deleteFile(tmpVideoFileName);
        tmpVideoFileName = tmp;
    }
    const out = await ffmpeg.readFile(tmpVideoFileName);
    await ffmpeg.deleteFile(tmpVideoFileName);
    return out;
};
exports.mergeAudiosIntoVideo = mergeAudiosIntoVideo;
const extractAudio = async (fileContent) => {
    const outputFileName = `${(0, string_1.generateRandomString)(10)}.mp3`;
    const ffmpeg = await (0, ffmpeg_1.getFFmpeg)();
    const tmpName = "input.mp4";
    await ffmpeg.writeFile(tmpName, fileContent);
    await ffmpeg.exec(['-i', tmpName, '-q:a', '0', '-map', 'a', outputFileName]);
    await ffmpeg.deleteFile(tmpName);
    return outputFileName;
};
const mergeAnAudioIntoVideo = async (videoFile, audioFile, startTime) => {
    const outputFileName = (0, string_1.generateRandomString)(10);
    const ffmpeg = await (0, ffmpeg_1.getFFmpeg)();
    await ffmpeg.exec([
        '-i', videoFile,
        '-i', audioFile,
        '-filter_complex',
        `[1:a]adelay=${startTime * 1000}|${startTime * 1000}[aud];[0:a][aud]amix`,
        '-c:v', 'copy',
        '-c:a', 'aac',
        outputFileName
    ]);
    return outputFileName;
};
