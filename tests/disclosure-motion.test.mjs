import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
const source=fs.readFileSync(new URL('../assets/portfolio.js',import.meta.url),'utf8');
const helpers=source.slice(source.indexOf('const disclosureAnimations'),source.indexOf('/** Secondary navigation'));
function setup(reduced=false){
 const animations=[],attrs=new Map([['aria-expanded','false']]);
 const button={getAttribute:k=>attrs.get(k),setAttribute:(k,v)=>attrs.set(k,v),focus(){}};
 const panel={hidden:true,inert:false,animate(frames,options){const animation={frames,options,cancel(){this.cancelled=true;}};animations.push(animation);return animation;}};
 const context=vm.createContext({window:{},document:{activeElement:null},matchMedia:()=>({matches:reduced}),getComputedStyle:()=>({opacity:'.6',transform:'matrix(1,0,0,1,0,-2)'}),setTimeout,clearTimeout});
 vm.runInContext(helpers,context);return {panel,button,animations,set:context.setPortfolioDisclosure};
}
test('interrupted exits cannot hide a reopened disclosure',()=>{
 const {panel,button,animations,set}=setup();set(panel,button,true);animations[0].onfinish();
 set(panel,button,false);const exit=animations[1];assert.equal(panel.inert,true);assert.equal(panel.hidden,false);
 set(panel,button,true);assert.equal(exit.cancelled,true);exit.onfinish();assert.equal(panel.hidden,false);assert.equal(panel.inert,false);
 animations[2].onfinish();assert.equal(panel.hidden,false);assert.equal(button.getAttribute('aria-expanded'),'true');
 set(panel,button,false);animations[3].onfinish();assert.equal(panel.hidden,true);
});
test('reduced motion updates visibility and accessibility without spatial animation',()=>{
 const {panel,button,animations,set}=setup(true);set(panel,button,true);assert.equal(panel.hidden,false);assert.equal(panel.inert,false);
 set(panel,button,false);assert.equal(panel.hidden,true);assert.equal(panel.inert,true);assert.equal(animations.length,0);
});
