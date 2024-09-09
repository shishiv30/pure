import  BaseResponseModel  from './basemodel';

export default class SapModel extends BaseResponseModel {
    constructor(data) {
        super({ name: data.name || 'SapModel' });

    }

}