"use client";
import {useGame} from '../runtime/game-context';
import {useSettings} from '../runtime/settings-context';
import {fortressText} from '../ui/fortress-display.js';
import {CurrencyAmount} from './ui';

export function FortressActivityLog(){
 const {campaign,content}=useGame(),{preferences}=useSettings(),session=campaign.chronicles.activeSession;
 if(!session||!preferences.chronicleLogs)return null;
 const entries=campaign.chronicles.books.book2.activityLog.filter((e:any)=>e.sessionId===session.sessionId).slice(-60).reverse();
 return <details className="panel fortress-history" open><summary>Nhật ký khám phá <small>Có thể tắt trong Thiết lập → Giao diện</small></summary>{entries.length?<ol aria-label="Lịch sử hoạt động trong phiên">{entries.map((entry:any)=><li key={entry.id}><header><strong>{content.chronicles.book2.locations.find((l:any)=>l.id===entry.locationId)?.name}</strong><time dateTime={entry.at}>{new Date(entry.at).toLocaleTimeString('vi-VN',{hour:'2-digit',minute:'2-digit',timeZone:'Asia/Ho_Chi_Minh'})}</time></header><p>{fortressText(content,entry.message)}</p><div className="chronicle-completion-rewards">{Object.entries(entry.reward??{}).map(([key,n])=><CurrencyAmount key={key} kind={key==='coins'?'coin':key==='prismaFragments'?'fragments':'pure'} amount={n as number}/>)}</div></li>)}</ol>:<p>Chưa có hoạt động được ghi nhận trong phiên này.</p>}</details>;
}
