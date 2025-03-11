import { Clockodo, Billability } from "clockodo";
import dateFormat from "dateformat";
import nfzf from 'node-fzf';
import ncp from 'copy-paste';

const [API_USER, API_KEY] = process.env.CLOCKODO_API.split(':');

/**
 * @param {number}  ms
 */
async function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

async function getCustomer() {
    const customers = await clockodo.getCustomers();
    const opts = {
        list: customers.customers.map(c => `${c.id}: ${c.name}`),
        query: process.env.CLOCKODO_DEFAULT_CUSTOMER,
    };
    const { selected } = await nfzf(opts);
    return ~~selected.value.split(':')[0];
}

/**
 * @param {number}  customersId
 */
async function getProjects(customersId) {
    const projects = await clockodo.getProjects({
        filterCustomersId: customersId,
    });
    const opts = {
        list: projects.projects.map(p => `${p.id}: ${p.name}`),
        query: process.env.CLOCKODO_DEFAULT_PROJECT,
    };
    const { selected } = await nfzf(opts);
    return ~~selected.value.split(':')[0];
}

async function getServices() {
    const services = await clockodo.getServices();
    const opts = {
        list: services.services.map(s => `${s.id}: ${s.name}`),
        query: process.env.CLOCKODO_DEFAULT_SERVICE,
    };
    const { selected } = await nfzf(opts);
    return ~~selected.value.split(':')[0];
}

function getJson() {
    let json
    try {
        json = JSON.parse(ncp.paste())
    } catch (e) {
        throw new Error("Failed to parse JSON from clipboard. Make sure you copied the right JSON from your Browsers DevTools.");
    }

    if (json.type !== 'Microsoft.SkypeSpaces.MiddleTier.Models.CalendarEvent') {
        throw new Error("JSON could be parsed, but the 'type' field must have the value 'Microsoft.SkypeSpaces.MiddleTier.Models.CalendarEvent'. Did you copy the wrong JSON?");
    }
    return json.value;
}

const entries = getJson();
console.log(entries[0]);

const clockodo = new Clockodo({
    client: {
        name: "MS Teams Import Script",
        email: "mail@eboland.de",
    },
    authentication: {
        user: API_USER,
        apiKey: API_KEY,
    },
});

const customersId = await getCustomer();

const projectsId = await getProjects(customersId);

const servicesId = await getServices();

for (const entry of entries) {
    let text = entry.subject;
    if (entry.isAllDayEvent) {
        continue;
    }
    if (entry.organizerName && entry.organizerName.includes('Enno') === false) {
        text += ` mit ${entry.organizerName.replace(/\([^\(]*\)/, '').trim()}`;
    }
    const startTime = new Date(entry.startTime);
    const endTime = new Date(entry.endTime);

    const datefmt = "UTC:yyyy-mm-dd'T'HH:MM:ss'Z'"
    const obj = {
        customersId,
        servicesId,
        projectsId,
        billable: Billability.Billable,
        timeSince: dateFormat(startTime, datefmt),
        timeUntil: dateFormat(endTime, datefmt),
        text,
    }

    console.log(obj.timeSince, obj.text);
    try {
        await clockodo.addEntry(obj);
    } catch (e) {
        console.log("Failed to add entry", obj);
    }
    await sleep(1000);
}
