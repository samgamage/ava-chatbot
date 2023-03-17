// @ts-nocheck
class SSE {
  // if (!(this instanceof SSE)) {
  //   return new SSE(url, options);
  // }

  xhr: XMLHttpRequest | null;

  constructor(
    url: string,
    options: {
      payload?: any;
      withCredentials?: any;
      headers?: any;
      method?: any;
    }
  ) {
    this.INITIALIZING = -1;
    this.CONNECTING = 0;
    this.OPEN = 1;
    this.CLOSED = 2;

    this.url = url;

    options = options || {};
    this.headers = options.headers || {};
    this.payload = options.payload !== undefined ? options.payload : "";
    this.method = options.method || (this.payload && "POST") || "GET";
    this.withCredentials = !!options.withCredentials;

    this.FIELD_SEPARATOR = ":";
    this.listeners = {};

    this.xhr = null;
    this.readyState = this.INITIALIZING;
    this.progress = 0;
    this.chunk = "";
  }

  addEventListener = (type: string | number, listener: any) => {
    if (this.listeners[type] === undefined) {
      this.listeners[type] = [];
    }

    if (this.listeners[type].indexOf(listener) === -1) {
      this.listeners[type].push(listener);
    }
  };

  removeEventListener = (type: string | number, listener: any) => {
    if (this.listeners[type] === undefined) {
      return;
    }

    var filtered: any[] = [];
    this.listeners[type].forEach(function (element: any) {
      if (element !== listener) {
        filtered.push(element);
      }
    });
    if (filtered.length === 0) {
      delete this.listeners[type];
    } else {
      this.listeners[type] = filtered;
    }
  };

  dispatchEvent = (e: { source: any; type: string; defaultPrevented: any }) => {
    if (!e) {
      return true;
    }

    e.source = this;

    var onHandler = "on" + e.type;
    if (this.hasOwnProperty(onHandler)) {
      this[onHandler].call(this, e);
      if (e.defaultPrevented) {
        return false;
      }
    }

    if (this.listeners[e.type]) {
      return this.listeners[e.type].every(function (
        callback: (arg0: any) => void
      ) {
        callback(e);
        return !e.defaultPrevented;
      });
    }

    return true;
  };

  _setReadyState = (state: any) => {
    var event = new CustomEvent("readystatechange");
    event.readyState = state;
    this.readyState = state;
    this.dispatchEvent(event);
  };

  _onStreamFailure = (e: { currentTarget: { response: any } }) => {
    var event = new CustomEvent("error");
    event.data = e.currentTarget.response;
    this.dispatchEvent(event);
    this.close();
  };

  _onStreamAbort = (e: any) => {
    this.dispatchEvent(new CustomEvent("abort"));
    this.close();
  };

  _onStreamProgress = (e: any) => {
    if (!this.xhr) {
      return;
    }

    if (this.xhr.status !== 200) {
      this._onStreamFailure(e);
      return;
    }

    if (this.readyState == this.CONNECTING) {
      this.dispatchEvent(new CustomEvent("open"));
      this._setReadyState(this.OPEN);
    }

    var data = this.xhr.responseText.substring(this.progress);
    this.progress += data.length;
    data.split(/(\r\n|\r|\n){2}/g).forEach(
      function (part: {
        trim: () => { (): any; new (): any; length: number };
      }) {
        if (part.trim().length === 0) {
          this.dispatchEvent(this._parseEventChunk(this.chunk.trim()));
          this.chunk = "";
        } else {
          this.chunk += part;
        }
      }.bind(this)
    );
  };

  _onStreamLoaded = (e: any) => {
    this._onStreamProgress(e);

    // Parse the last chunk.
    this.dispatchEvent(this._parseEventChunk(this.chunk));
    this.chunk = "";
  };

  /**
   * Parse a received SSE event chunk into a constructed event object.
   */
  _parseEventChunk = (chunk: string) => {
    if (!chunk || chunk.length === 0) {
      return null;
    }

    var e = { id: null, retry: null, data: "", event: "message" };
    chunk.split(/\n|\r\n|\r/).forEach(
      function (line: string) {
        line = line.trimRight();
        var index = line.indexOf(this.FIELD_SEPARATOR);
        if (index <= 0) {
          // Line was either empty, or started with a separator and is a comment.
          // Either way, ignore.
          return;
        }

        var field = line.substring(0, index);
        if (!(field in e)) {
          return;
        }

        var value = line.substring(index + 1).trimLeft();
        if (field === "data") {
          e[field] += value;
        } else {
          e[field] = value;
        }
      }.bind(this)
    );

    var event = new CustomEvent(e.event);
    event.data = e.data;
    event.id = e.id;
    return event;
  };

  _checkStreamClosed = () => {
    if (!this.xhr) {
      return;
    }

    if (this.xhr.readyState === XMLHttpRequest.DONE) {
      this._setReadyState(this.CLOSED);
    }
  };

  stream = () => {
    this._setReadyState(this.CONNECTING);

    this.xhr = new XMLHttpRequest();
    this.xhr.addEventListener("progress", this._onStreamProgress.bind(this));
    this.xhr.addEventListener("load", this._onStreamLoaded.bind(this));
    this.xhr.addEventListener(
      "readystatechange",
      this._checkStreamClosed.bind(this)
    );
    this.xhr.addEventListener("error", this._onStreamFailure.bind(this));
    this.xhr.addEventListener("abort", this._onStreamAbort.bind(this));
    this.xhr.open(this.method, this.url);
    for (var header in this.headers) {
      this.xhr.setRequestHeader(header, this.headers[header]);
    }
    this.xhr.withCredentials = this.withCredentials;
    this.xhr.send(JSON.stringify(this.payload));
  };

  close = () => {
    if (this.readyState === this.CLOSED) {
      return;
    }

    this.xhr.abort();
    this.xhr = null;
    this._setReadyState(this.CLOSED);
  };
}

export default SSE;
