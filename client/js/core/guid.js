//export guid, everytime value +1
export default {
    guid: 1,
    get: function () {
        return this.guid++;
    }
};