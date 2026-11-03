export const enquiryServices=['School events','Portraits','Editorial photography','Documentation','Video editing','Other'];
export function validateEnquiry(body,today=new Intl.DateTimeFormat('en-CA',{timeZone:'Asia/Manila',year:'numeric',month:'2-digit',day:'2-digit'}).format(new Date())){
 if(!body||typeof body!=='object')return {error:'Please complete the enquiry form.'};const text=key=>typeof body[key]==='string'?body[key].trim():'';const name=text('name'),email=text('email'),service=text('service'),eventDate=text('eventDate'),place=text('place'),message=text('message'),requestId=text('requestId');
 if(name.length<2||name.length>80)return {error:'Enter your name (2–80 characters).'};
 if(email.length>254||!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email))return {error:'Enter a valid email address.'};
 if(!enquiryServices.includes(service))return {error:'Choose a service.'};
 if(eventDate&&(!/^\d{4}-\d{2}-\d{2}$/.test(eventDate)||!Number.isFinite(Date.parse(eventDate))||new Date(eventDate).toISOString().slice(0,10)!==eventDate||eventDate<today))return {error:'Choose a valid event date today or later, or leave it blank.'};
 if(place.length>160)return {error:'Keep the location under 160 characters.'};if(message.length<10||message.length>4000)return {error:'Describe your project in 10–4,000 characters.'};if(!/^[a-f\d]{8}-[a-f\d]{4}-[a-f\d]{4}-[a-f\d]{4}-[a-f\d]{12}$/i.test(requestId))return {error:'Refresh the form and try again.'};return {value:{name,email,service,eventDate,place,message,requestId}};
}
