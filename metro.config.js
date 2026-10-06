const { getDefaultConfig } = require("expo/metro-config");
const { withNativeWind } = require("nativewind/metro");

const { coversMiddleware } = require("./server/covers-middleware");

const config = withNativeWind(getDefaultConfig(__dirname), { input: "./global.css" });
const previous = config.server?.enhanceMiddleware;
config.server.enhanceMiddleware = (metroMiddleware, metroServer) => {
  const next = coversMiddleware(metroMiddleware);
  return previous ? previous(next, metroServer) : next;
};

module.exports = config;
