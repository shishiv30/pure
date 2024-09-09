export class DataWatcher {
    constructor(obj, updateFunction) {
      this.originalObject = obj;
      this.updateFunction = updateFunction;
      this.proxy = this.createProxy(obj);
    }
  
    createProxy(obj) {
      const updateFunction = this.updateFunction;
      return new Proxy(obj, {
        set(target, property, value) {
          const result = Reflect.set(...arguments);
          updateFunction(property);
          return result;
        }
      });
    }
  
    getProxy() {
      return this.proxy;
    }
  }