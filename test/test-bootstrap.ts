import { use } from "chai";

const cliGlobal = <ICliGlobal>global;

cliGlobal._ = require("lodash");
cliGlobal.$injector = require("mobile-cli-lib/yok").injector;

use(require("chai-as-promised"));

// Converts the js callstack to typescript
import errors = require("mobile-cli-lib/errors");
errors.installUncaughtExceptionListener();
