// This file is required for Expo/React Native SQLite migrations - https://orm.drizzle.team/quick-sqlite/expo

import journal from './meta/_journal.json';
import m0000 from './0000_aberrant_ghost_rider.sql';
import m0001 from './0001_shallow_power_man.sql';
import m0002 from './0002_eminent_roland_deschain.sql';
import m0003 from './0003_settings_notifications_currency_defaults.sql';
import m0004 from './0004_card_custom_financials.sql';
import m0005 from './0005_multi_payday.sql';
import m0006 from './0006_installments_subscriptions.sql';
import m0007 from './0007_payoff_strategy.sql';
import m0008 from './0008_multi_currency.sql';
import m0009 from './0009_avatar_emoji.sql';

  export default {
    journal,
    migrations: {
      m0000,
m0001,
m0002,
m0003,
m0004,
m0005,
m0006,
m0007,
m0008,
m0009
    }
  }
  