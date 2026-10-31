import test from 'node:test';
import assert from 'node:assert/strict';
import { GamepadReader, spatialNext } from '../src/ui/gamepad-input.js';
import { readSettings, normalizeSettings, DEFAULT_SETTINGS } from '../src/ui/preferences.js';
const pad = () => ({ id:'Xbox',index:0,connected:true,mapping:'standard',axes:[0,0,0,0],buttons:Array.from({length:17},()=>({pressed:false,value:0})) });
test('button commands require a new press and held A cannot leak through connect, modal or reconnect', () => {
  const reader=new GamepadReader(), controller=pad();
  controller.buttons[0].pressed=true; assert.deepEqual(reader.read(controller,0).actions,[]);
  assert.deepEqual(reader.read(controller,30).actions,[]);
  controller.buttons[0].pressed=false;reader.read(controller,40);
  controller.buttons[0].pressed=true;assert.deepEqual(reader.read(controller,50).actions,['a']);
  assert.deepEqual(reader.read(controller,1000).actions,[]);
  reader.read(null,1100);assert.deepEqual(reader.read(controller,1200).actions,[]);
});
test('D-pad and sticks have a deadzone and navigation-only repeat; unsupported mappings produce no input', () => {
  const reader=new GamepadReader(), controller=pad();reader.read(controller,0);
  controller.axes[0]=.4;assert.deepEqual(reader.read(controller,10).actions,[]);
  controller.axes[0]=.8;assert.deepEqual(reader.read(controller,20).actions,['right']);
  assert.deepEqual(reader.read(controller,369).actions,[]);assert.deepEqual(reader.read(controller,370).actions,['right']);
  assert.deepEqual(reader.read(controller,400).actions,[]);assert.deepEqual(reader.read(controller,490).actions,['right']);
  controller.axes[0]=0;controller.buttons[12].pressed=true;assert.deepEqual(reader.read(controller,510).actions,['up']);
  controller.buttons[9].pressed=true;assert.deepEqual(reader.read(controller,900).actions,['menu']);
  controller.mapping='';assert.deepEqual(reader.read(controller,1000).actions,[]);
});
test('spatial focus follows visible geometry and never selects the opposite direction', () => {
  const items=[{id:'a',left:0,right:100,top:0,bottom:100},{id:'b',left:120,right:220,top:0,bottom:100},{id:'c',left:0,right:100,top:130,bottom:230},{id:'d',left:120,right:220,top:130,bottom:230}];
  assert.equal(spatialNext(items,'a','right'),'b');assert.equal(spatialNext(items,'a','down'),'c');assert.equal(spatialNext(items,'d','up'),'b');assert.equal(spatialNext(items,'a','left'),null);
});
test('preferences tolerate unavailable/corrupt storage and normalize only supported values', () => {
  assert.deepEqual(readSettings({getItem(){throw new Error('blocked')}}),DEFAULT_SETTINGS);
  assert.deepEqual(readSettings({getItem(){return 'broken'}}),DEFAULT_SETTINGS);
  const parsed=normalizeSettings({controlMode:'gamepad',musicEnabled:false,musicVolume:.6,rumble:false,showHints:false,campaign:{coins:999}});
  assert.deepEqual(parsed,{controlMode:'gamepad',musicEnabled:false,musicVolume:.6,rumble:false,showHints:false,logoStyle:'en',battleLogs:true});
  assert.equal(normalizeSettings({musicVolume:5,controlMode:'unknown'}).musicVolume,.35);
});
