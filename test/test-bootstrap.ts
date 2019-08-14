import { use } from "chai";

const cliGlobal = <ICliGlobal>global;

cliGlobal._ = require("lodash");
cliGlobal.$injector = require("nativescript/lib/common/yok").injector;

use(require("chai-as-promised"));
