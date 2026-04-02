// This file is required for Expo/React Native SQLite migrations - https://orm.drizzle.team/quick-sqlite/expo

import journal from './meta/_journal.json';
import m0000 from './0000_aberrant_ghost_rider.sql';
import m0001 from './0001_shallow_power_man.sql';
import m0002 from './0002_eminent_roland_deschain.sql';
import m0003 from './0003_settings_notifications_currency_defaults.sql';

  export default {
    journal,
    migrations: {
      m0000,
m0001,
m0002,
m0003
    }
  }
  