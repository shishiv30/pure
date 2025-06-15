import { map } from "lodash";

export const conponentType = {
    MAP: 'map',
    SLIDER: 'slider',
    WORKFLOW: 'workflow',
    DIALOG: 'dialog',
    FORM: 'form',
    FILTER: 'filter',
    TABLE: 'table',
    CHART: 'chart',
    LIST: 'list',
    INFO: 'info',
    WORKFLOW: 'workflow',
}
export class Store {
    init(option){
        if(!option){
            console.error('Store option is required');
            return;
        }
        this.mapping = option.mapping;
        this.createUrl = option.createUrl;
        this.updateUrl = option.updateUrl;
        this.deleteUrl = option.deleteUrl;
        this.getListUrl = options.getListUrl;
        this.getDetailUrl = options.getDetailUrl;
        this.loginUrl = options.loginUrl;
        this.editProfileUrl = options.editProfileUrl;
        this.updateFileUrl = options.updateFileUrl;
        this.signupUrl = options.signupUrl;
        this.logoutUrl = options.logoutUrl;
        this.createLeadUrl = options.createLeadUrl;

        let details = this.mapping.detail ? this.mapping.detail(options.detail, options) : options.detail;
        let user = this.mapping.user ? this.mapping.user(options.user, options) : options.user;
        this.data = {
            geo: options.geo || null,
            detail: details && details.id ? {
                id: details.id,
                name: details.name || '',
                geo: details.geo || null,
                tags: details.tags || null, //[tag1, tag2, tag3]
                status: details.status || '',
                location: details.location || '',
                attrubutes: details.attrubutes || null,// {key: value}
                sections: details.sections || null,
             } : null,
            user: user && user.id ? {
                id: options.user.id,
                name: options.user.name || '',
                email: options.user.email || '',
                phone: options.user.phone || '',
                role: options.user.role || '',
                status: options.user.status || '', //active, inactive, removed
            } : null,
            list: [],
        };
    }

    load(){

    }
    create(){

    }
    delete(){

    }
    update(){

    }
    mapping(){

    }
}