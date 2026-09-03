import { env } from '../bootstrap/env';

export const appConfig = {
  port: env.port,
  nodeEnv: env.nodeEnv,
  corsOrigin: env.corsOrigin,
};
