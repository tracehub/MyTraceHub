///<reference path="../typings/jquery/jquery.d.ts" />
///<reference path="../typings/signalr/signalr.d.ts" />
var Fonlow_Logging;
(function (Fonlow_Logging) {
    //export interface ILoggingClient {
    //    writeMessage(m: string);
    //    writeMessages(ms: string[]);
    //    writeTrace(tm: TraceMessage);
    //    writeTraces(tms: TraceMessage[]);
    //}
    //export interface ILogging {
    //    writeTrace(tm: TraceMessage);
    //    writeTraces(tms: TraceMessage[]);
    //}
    var ClientFunctions = (function () {
        function ClientFunctions() {
            var _this = this;
            this.bufferSize = 10000;
            this.writeTrace = function (tm) {
                _this.addLine(tm);
            };
            this.writeTraces = function (tms) {
                //Clean up some space first
                if (lineCount + tms.length > _this.bufferSize) {
                    var numberOfLineToRemove = lineCount + tms.length - _this.bufferSize;
                    $('#traces li:nth-last-child(-n+' + numberOfLineToRemove + ')').remove(); //Thanks to this trick http://stackoverflow.com/questions/9443101/how-to-remove-the-n-number-of-first-or-last-elements-with-jquery-in-an-optimal, much faster than my loop
                    lineCount -= numberOfLineToRemove;
                }
                //Buffer what to add
                var itemsToPrepend = $();
                $.each(tms.reverse(), function (index, tm) {
                    itemsToPrepend = itemsToPrepend.add(_this.createNewLine(tm)); //prepend of siblings
                    evenLine = !evenLine; //Silly, I should have used math :), but I wanted simplicity
                });
                $('#traces').prepend(itemsToPrepend);
                lineCount += tms.length;
            };
        }
        ClientFunctions.prototype.eventTypeToString = function (t) {
            switch (t) {
                case 1:
                    return "Critical";
                case 2:
                    return "Error";
                case 4:
                    return "Warning";
                case 8:
                    return "Info";
                case 16:
                    return "Verbose";
                case 256:
                    return "Start";
                case 512:
                    return "Stop";
                case 1024:
                    return "Suspend";
                case 2048:
                    return "Resume";
                case 4096:
                    return "Transfer";
                default:
                    return "Misc ";
            }
        };
        ClientFunctions.prototype.createNewLine = function (tm) {
            var et = this.eventTypeToString(tm.eventType);
            var $eventText = $('<span/>', { class: et }).text(et + ': ');
            var $timeText = $('<span/>', { class: 'time' }).text(' ' + tm.timeUtc + ' ');
            var $originText = $('<span/>', { class: 'origin' }).text(' ' + tm.origin + '  ');
            var newLine = $('<li/>', { class: evenLine ? 'even' : 'odd' });
            newLine.append($eventText);
            newLine.append($timeText);
            newLine.append($originText);
            newLine.append(tm.message);
            return newLine;
        };
        ClientFunctions.prototype.addLine = function (tm) {
            var newLine = this.createNewLine(tm);
            $('#traces').prepend(newLine);
            evenLine = !evenLine;
            lineCount++;
            if (lineCount > this.bufferSize) {
                $('#traces li:last').remove();
            }
        };
        ClientFunctions.prototype.writeMessage = function (m) {
            $('#traces').append('<li>' + m + '</li>');
        };
        ClientFunctions.prototype.writeMessages = function (ms) {
            ms.forEach(function (m) {
                $('#traces').append('<li><strong>' + m + '</li>');
            });
        };
        return ClientFunctions;
    }());
    Fonlow_Logging.ClientFunctions = ClientFunctions;
    var ManagementFunctions = (function () {
        function ManagementFunctions() {
        }
        ManagementFunctions.prototype.clear = function () {
            $('#traces').empty();
            lineCount = 0;
        };
        return ManagementFunctions;
    }());
    Fonlow_Logging.ManagementFunctions = ManagementFunctions;
})(Fonlow_Logging || (Fonlow_Logging = {}));
var evenLine = false;
var lineCount = 0;
var clientFunctions = new Fonlow_Logging.ClientFunctions();
var managementFunctions = new Fonlow_Logging.ManagementFunctions();
//# sourceMappingURL=logging.js.map