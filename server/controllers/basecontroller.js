import {SapModel} from '../models/sapmodel.js';
export default class BaseController {
	constructor() {
		this.model = null;
	}

	async create(data) {
        let serverData = this._toServerData(data);
		const result = await this.model.create(serverData);
		return result;
	}

	async update(id, data) {
        let serverData = this._toServerData(data);
		const result = await this.model.update(id, serverData);
		return result;
	}

	async delete(id) {
		const result = await this.model.delete(id);
		return result;
	}

	async get(filter) {
		const result = await this.model.get(filter);
		return result;
	}

    _toServerFilter(filter) {
        return filter;
    }

    toClientFilter(filter) {
        return filter;
    }

    _toServerData(data) {
        return data;
    }

    toClientData(data) {
        return data;
    }

    mapPage(page) {
        let clientData = this.toClientData(page.data);
        return this.toClientPage(clientData);
    }

    mapData(data) {
        this._mapData(data);
        return data;
    }
    async sendApi(req, res, data) {
        res.json(data);
    }
    async toPage(req, res) {
        this.model.filter = this._toServerFilter(req);
        let data = await this.get(this.model.filter);
        //use model.ejs URl + model.pageData to render view
        res.render(view, data);
    }
}
