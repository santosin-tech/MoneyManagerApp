LOG 📦 Checking database tables...
LOG 🌱 Database already seeded – skipping
LOG ✅ Database fully ready
Android Bundled 210ms utils\notifications.js (1 module)
ERROR [Error: Requiring unknown module "1643". If you are sure the module exists, try restarting Metro. You may also want to run `yarn` or `npm install`.]

Code: notifications.js
1 | // utils/notifications.js

> 2 | import \* as Notifications from "expo-notifications";

    | ^

3 | import { Platform } from "react-native";
4 |
5 | // Show notifications even when the app is in the foreground
Call Stack
<global> (utils\notifications.js:2)

const sentWarnings = new Set();
119 |

> 120 | export async function checkBudgetsAndNotify(budgets) {

      |                       ^

121 | const hasPermission = await requestNotificationPermission();
122 | if (!hasPermission) return;
123 |
at constructor (C:\Users\hp\Santosin\mobileApp\MoneyManagerApp\node_modules\@babel\parser\lib\index.js:369:19)
at FlowParserMixin.raise (C:\Users\hp\Santosin\mobileApp\MoneyManagerApp\node_modules\@babel\parser\lib\index.js:6622:19)
at FlowScopeHandler.checkRedeclarationInScope (C:\Users\hp\Santosin\mobileApp\MoneyManagerApp\node_modules\@babel\parser\lib\index.js:1623:19)
at FlowScopeHandler.declareName (C:\Users\hp\Santosin\mobileApp\MoneyManagerApp\node_modules\@babel\parser\lib\index.js:1589:12)
at FlowScopeHandler.declareName (C:\Users\hp\Santosin\mobileApp\MoneyManagerApp\node_modules\@babel\parser\lib\index.js:1690:11)
at FlowParserMixin.registerFunctionStatementId (C:\Users\hp\Santosin\mobileApp\MoneyManagerApp\node_modules\@babel\parser\lib\index.js:13500:16)
at FlowParserMixin.parseFunction (C:\Users\hp\Santosin\mobileApp\MoneyManagerApp\node_modules\@babel\parser\lib\index.js:13484:12)
at FlowParserMixin.parseFunctionStatement (C:\Users\hp\Santosin\mobileApp\MoneyManagerApp\node_modules\@babel\parser\lib\index.js:13159:17)
at FlowParserMixin.parseStatementContent (C:\Users\hp\Santosin\mobileApp\MoneyManagerApp\node_modules\@babel\parser\lib\index.js:12924:25)
at FlowParserMixin.parseStatementLike (C:\Users\hp\Santosin\mobileApp\MoneyManagerApp\node_modules\@babel\parser\lib\index.js:12801:17)
at FlowParserMixin.parseStatementLike (C:\Users\hp\Santosin\mobileApp\MoneyManagerApp\node_modules\@babel\parser\lib\index.js:2934:24)
at FlowParserMixin.parseStatementListItem (C:\Users\hp\Santosin\mobileApp\MoneyManagerApp\node_modules\@babel\parser\lib\index.js:12781:17)
at FlowParserMixin.parseExportDeclaration (C:\Users\hp\Santosin\mobileApp\MoneyManagerApp\node_modules\@babel\parser\lib\index.js:13968:17)
at FlowParserMixin.parseExportDeclaration (C:\Users\hp\Santosin\mobileApp\MoneyManagerApp\node_modules\@babel\parser\lib\index.js:3138:20)
at FlowParserMixin.maybeParseExportDeclaration (C:\Users\hp\Santosin\mobileApp\MoneyManagerApp\node_modules\@babel\parser\lib\index.js:13927:31)
at FlowParserMixin.parseExport (C:\Users\hp\Santosin\mobileApp\MoneyManagerApp\node_modules\@babel\parser\lib\index.js:13846:29)
at FlowParserMixin.parseStatementContent (C:\Users\hp\Santosin\mobileApp\MoneyManagerApp\node_modules\@babel\parser\lib\index.js:12912:27)
at FlowParserMixin.parseStatementLike (C:\Users\hp\Santosin\mobileApp\MoneyManagerApp\node_modules\@babel\parser\lib\index.js:12801:17)
at FlowParserMixin.parseStatementLike (C:\Users\hp\Santosin\mobileApp\MoneyManagerApp\node_modules\@babel\parser\lib\index.js:2934:24)
at FlowParserMixin.parseModuleItem (C:\Users\hp\Santosin\mobileApp\MoneyManagerApp\node_modules\@babel\parser\lib\index.js:12778:17)
at FlowParserMixin.parseBlockOrModuleBlockBody (C:\Users\hp\Santosin\mobileApp\MoneyManagerApp\node_modules\@babel\parser\lib\index.js:13350:36)
at FlowParserMixin.parseBlockBody (C:\Users\hp\Santosin\mobileApp\MoneyManagerApp\node_modules\@babel\parser\lib\index.js:13343:10)
at FlowParserMixin.parseProgram (C:\Users\hp\Santosin\mobileApp\MoneyManagerApp\node_modules\@babel\parser\lib\index.js:12656:10)
at FlowParserMixin.parseTopLevel (C:\Users\hp\Santosin\mobileApp\MoneyManagerApp\node_modules\@babel\parser\lib\index.js:12646:25)
at FlowParserMixin.parseTopLevel (C:\Users\hp\Santosin\mobileApp\MoneyManagerApp\node_modules\@babel\parser\lib\index.js:3703:28)
at FlowParserMixin.parse (C:\Users\hp\Santosin\mobileApp\MoneyManagerApp\node_modules\@babel\parser\lib\index.js:14522:25)
at parse (C:\Users\hp\Santosin\mobileApp\MoneyManagerApp\node_modules\@babel\parser\lib\index.js:14535:26)
at parser (C:\Users\hp\Santosin\mobileApp\MoneyManagerApp\node_modules\@babel\core\lib\parser\index.js:41:34)
at parser.next (<anonymous>)
at normalizeFile (C:\Users\hp\Santosin\mobileApp\MoneyManagerApp\node_modules\@babel\core\lib\transformation\normalize-file.js:51:37)
at normalizeFile.next (<anonymous>)
at run (C:\Users\hp\Santosin\mobileApp\MoneyManagerApp\node_modules\@babel\core\lib\transformation\index.js:22:50)
at run.next (<anonymous>)
at transform (C:\Users\hp\Santosin\mobileApp\MoneyManagerApp\node_modules\@babel\core\lib\transform.js:22:33)
at transform.next (<anonymous>)
at evaluateSync (C:\Users\hp\Santosin\mobileApp\MoneyManagerApp\node_modules\gensync\index.js:251:28)
at sync (C:\Users\hp\Santosin\mobileApp\MoneyManagerApp\node_modules\gensync\index.js:89:14)
at stopHiding - secret - don't use this - v1 (C:\Users\hp\Santosin\mobileApp\MoneyManagerApp\node_modules\@babel\core\lib\errors\rewrite-stack-trace.js:47:12)
at Object.transformSync (C:\Users\hp\Santosin\mobileApp\MoneyManagerApp\node_modules\@babel\core\lib\transform.js:40:76)
at parseWithBabel (C:\Users\hp\Santosin\mobileApp\MoneyManagerApp\node_modules\@expo\metro-config\build\transformSync.js:75:18)
at transformSync (C:\Users\hp\Santosin\mobileApp\MoneyManagerApp\node_modules\@expo\metro-config\build\transformSync.js:64:12)
at Object.transform (C:\Users\hp\Santosin\mobileApp\MoneyManagerApp\node_modules\@expo\metro-config\build\babel-transformer.js:146:58)
at transformJSWithBabel (C:\Users\hp\Santosin\mobileApp\MoneyManagerApp\node_modules\@expo\metro-config\build\transform-worker\metro-transform-worker.js:495:47)
at Object.transform (C:\Users\hp\Santosin\mobileApp\MoneyManagerApp\node_modules\@expo\metro-config\build\transform-worker\metro-transform-worker.js:614:12)
at Object.transform (C:\Users\hp\Santosin\mobileApp\MoneyManagerApp\node_modules\@expo\metro-config\build\transform-worker\transform-worker.js:179:19)
at transformFile (C:\Users\hp\Santosin\mobileApp\MoneyManagerApp\node_modules\metro\src\DeltaBundler\Worker.flow.js:67:36)
at Object.transform (C:\Users\hp\Santosin\mobileApp\MoneyManagerApp\node_modules\metro\src\DeltaBundler\Worker.flow.js:42:10)
at WorkerFarm.transform (C:\Users\hp\Santosin\mobileApp\MoneyManagerApp\node_modules\metro\src\DeltaBundler\WorkerFarm.js:44:39)
at Transformer.transformFile (C:\Users\hp\Santosin\mobileApp\MoneyManagerApp\node_modules\metro\src\DeltaBundler\Transformer.js:124:32)
at async bundler.transformFile (C:\Users\hp\Santosin\mobileApp\MoneyManagerApp\node_modules\@expo\metro-config\build\serializer\packedMap.js:172:41)
