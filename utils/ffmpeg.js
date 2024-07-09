"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getFFmpeg = void 0;
const ffmpeg_static_1 = __importDefault(require("ffmpeg-static"));
const fluent_ffmpeg_1 = __importDefault(require("fluent-ffmpeg"));
// Tell fluent-ffmpeg where it can find FFmpeg
fluent_ffmpeg_1.default.setFfmpegPath(ffmpeg_static_1.default);
const getFFmpeg = async () => {
    return fluent_ffmpeg_1.default;
};
exports.getFFmpeg = getFFmpeg;
