import {formatCaplized} from './format.js';
import { trigger } from '../core/event.js';

/**
 * base on provided key, the made an element could switch between true and false status.
 * @param {*} name the key name will be used to store the current status
 * @param {*} $el the element will support the className ${name}
 * @param {*} opt  the options will include beforeAddName, afterAddName, beforeRemoveName, afterRemoveName
 * @param {*} exportObj  the object will be injected with the following methods addName, removeName, toggleName, isName
 */
export function defBool (name, $el, opt, exportObj) {
    //name first letter to upper case
   let methodName = formatCaplized(name);
    exportObj[`add${methodName}`] = ()=>{
        opt[`beforeAdd${methodName}`] && trigger(opt[`beforeAdd${methodName}`], $el, opt, exportObj);
        $el.classList.add(name);
        exportObj.name = true;
        opt[`afterAdd${methodName}`] && trigger(opt[`afterAdd${methodName}`], $el, opt, exportObj);
    }
    exportObj[`remove${methodName}`] = ()=>{
        opt[`beforeRemove${methodName}`] && trigger(opt[`beforeRemove${methodName}`], $el, opt, exportObj);
        $el.classList.remove(name);
        exportObj.name = false;
        opt[`afterRemove${methodName}`] && trigger(opt[`afterRemove${methodName}`], $el, opt, exportObj);
    }

    exportObj[`toggle${methodName}`] = ()=>{
        if($el.classList.contains(name)){
            exportObj[`remove${methodName}`]();
        }else{
            exportObj[`add${methodName}`]();
        }
    }

    exportObj[`is${methodName}`] = ()=>{
        return $el.classList.contains(name);
    }
}




/**
 * base on provided key and possible values, the made an element could switch diff status.
 * @param {*} key the key name will be used to store the current status
 * @param {*} names the value could be switched to like ['nameA', 'nameB', 'nameC']
 * @param {*} $el the element will support the className ${key}-${nameA}, ${key}-${nameB}, ${key}-${nameC}
 * @param {*} opt  the options will include beforeSwitchToNameA, afterSwitchToNameA
 * @param {*} exportObj  the object will be injected with the following methods switchToNameA, switchToNameB, switchToNameC ...
 */
export function defEnum (key, names, $el, opt, exportObj) {
    names.forEach((name, index) => {
        let methodNames = formatCaplized(name);
        exportObj[`switchTo${methodNames}`] = () => {
            if(name != exportObj[key]){
                opt[`beforeSwitchTo${methodNames}`] && trigger(opt[`beforeSwitchTo${methodNames}`], $el, opt, exportObj);
                names.forEach((item, index) => {
                    if(item !== name){
                        $el.classList.remove(`${key}-${item}`);
                    } else {
                        $el.classList.add(`${key}-${item}`);
                        exportObj[key] = item;
                    }
                });
                opt[`afterSwitchTo${methodNames}`] && trigger(opt[`afterSwitchTo${methodNames}`], $el, opt, exportObj);
            }
        }
    });
    exportObj[`current${formatCaplized(key)}`] = () => {
        return exportObj[key];
    };
}