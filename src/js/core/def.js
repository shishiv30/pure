import {formatCaplized} from './format.js';
import { trigger } from '../core/event.js';

//any name provided will be convert to camel case
//the export obj will be injected with the following methods
//addName, removeName, toggleName, isName
//addName will add the class name to the element
//removeName will remove the class name from the element
//toggleName will toggle the class name from the element
//isName will return true if the class name is present in the element
//if opt include beforeAddName, afterAddName, beforeRemoveName, afterRemoveName
//it will be triggered before and after the add and remove method
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


//any name provided will be convert to camel case
//the export obj will be injected with the following methods
//switchToNameA, switchToNameB, switchToNameC ...
//switchToNameA will remove all other names and add class ${key}-${nameA} to the element
//if opt include beforeSwitchToNameA, afterSwitchToNameA
//it will be triggered before and after the switch method


export function defEnum (key, names, $el, opt, exportObj) {
    let methodNames = names.map((name) => {
		return formatCaplized(name);
	});
    methodNames.forEach((methodName, index) => {
        exportObj[`switchTo${methodName}`] = () => {
            if(methodName != exportObj[key]){
                opt[`beforeSwitchTo${methodName}`] && trigger(opt[`beforeSwitchTo${methodName}`], $el, opt, exportObj);
                methodNames.forEach((name, index) => {
                    if(name !== methodName){
                        $el.classList.remove(`${key}-${name}`);
                    } else {
                        $el.classList.add(`${key}-${name}`);
                    }
                });
                exportObj[key] = methodName;
                opt[`afterSwitchTo${methodName}`] && trigger(opt[`afterSwitchTo${methodName}`], $el, opt, exportObj);
            }
        }
    });
    exportObj[`current${formatCaplized(key)}`] = () => {
        return exportObj[key];
    };
}