import assert from 'node:assert/strict';
import * as fs from 'node:fs';
import * as os from 'node:os';
import * as path from 'node:path';
import { after, before, describe, it } from 'node:test';
import { fileURLToPath } from 'node:url';
import {
  launchBrowser,
  markdownImageFrom,
  renderBpmnToSvg,
  writeSvgForBpmn,
} from './bpmn-to-svg.mjs';

const template = fileURLToPath(
  new URL('../openspec/schemas/spec-driven-bpmn/templates/process.bpmn', import.meta.url),
);

describe('bpmn-js svg export', () => {
  let browser;

  before(async () => {
    browser = await launchBrowser();
  });

  after(async () => {
    await browser?.close();
  });

  it('validates the schema template and exports an svg with the event names', async () => {
    const svg = await renderBpmnToSvg(fs.readFileSync(template, 'utf8'), browser);

    assert.match(svg, /<svg/);
    assert.match(svg, /Start/);
    assert.match(svg, /End/);
  });

  it('exports task and gateway labels from a diagram bpmn-js accepts', async () => {
    const svg = await renderBpmnToSvg(
      `<?xml version="1.0" encoding="UTF-8"?>
      <bpmn:definitions xmlns:bpmn="http://www.omg.org/spec/BPMN/20100524/MODEL" xmlns:bpmndi="http://www.omg.org/spec/BPMN/20100524/DI" xmlns:dc="http://www.omg.org/spec/DD/20100524/DC" xmlns:di="http://www.omg.org/spec/DD/20100524/DI" id="Definitions_1" targetNamespace="http://finance-manager.local/bpmn">
        <bpmn:process id="transfer" name="Transfer" isExecutable="false">
          <bpmn:startEvent id="start" name="Início"><bpmn:outgoing>f1</bpmn:outgoing></bpmn:startEvent>
          <bpmn:exclusiveGateway id="gate" name="Saldo suficiente?"><bpmn:incoming>f1</bpmn:incoming><bpmn:outgoing>f2</bpmn:outgoing></bpmn:exclusiveGateway>
          <bpmn:task id="debit" name="Debitar origem"><bpmn:incoming>f2</bpmn:incoming><bpmn:outgoing>f3</bpmn:outgoing></bpmn:task>
          <bpmn:endEvent id="end" name="Fim"><bpmn:incoming>f3</bpmn:incoming></bpmn:endEvent>
          <bpmn:sequenceFlow id="f1" sourceRef="start" targetRef="gate"/>
          <bpmn:sequenceFlow id="f2" name="sim" sourceRef="gate" targetRef="debit"/>
          <bpmn:sequenceFlow id="f3" sourceRef="debit" targetRef="end"/>
        </bpmn:process>
        <bpmndi:BPMNDiagram id="d1">
          <bpmndi:BPMNPlane id="p1" bpmnElement="transfer">
            <bpmndi:BPMNShape id="start_di" bpmnElement="start"><dc:Bounds x="40" y="80" width="36" height="36"/></bpmndi:BPMNShape>
            <bpmndi:BPMNShape id="gate_di" bpmnElement="gate"><dc:Bounds x="120" y="73" width="50" height="50"/></bpmndi:BPMNShape>
            <bpmndi:BPMNShape id="debit_di" bpmnElement="debit"><dc:Bounds x="220" y="68" width="120" height="60"/></bpmndi:BPMNShape>
            <bpmndi:BPMNShape id="end_di" bpmnElement="end"><dc:Bounds x="390" y="80" width="36" height="36"/></bpmndi:BPMNShape>
            <bpmndi:BPMNEdge id="f1_di" bpmnElement="f1"><di:waypoint x="76" y="98"/><di:waypoint x="120" y="98"/></bpmndi:BPMNEdge>
            <bpmndi:BPMNEdge id="f2_di" bpmnElement="f2"><di:waypoint x="170" y="98"/><di:waypoint x="220" y="98"/></bpmndi:BPMNEdge>
            <bpmndi:BPMNEdge id="f3_di" bpmnElement="f3"><di:waypoint x="340" y="98"/><di:waypoint x="390" y="98"/></bpmndi:BPMNEdge>
          </bpmndi:BPMNPlane>
        </bpmndi:BPMNDiagram>
      </bpmn:definitions>`,
      browser,
    );

    assert.match(svg, /Debitar origem/);
    assert.match(svg, /Saldo suficiente\?/);
    assert.match(svg, /sim/);
  });

  it('rejects a diagram bpmn-js cannot import', async () => {
    await assert.rejects(() =>
      renderBpmnToSvg(
        `<bpmn:definitions xmlns:bpmn="http://www.omg.org/spec/BPMN/20100524/MODEL">
          <bpmn:process id="broken" isExecutable="false">
            <bpmn:task id="only"/>
            <bpmn:sequenceFlow id="f" sourceRef="only" targetRef="missing"/>
          </bpmn:process>
        </bpmn:definitions>`,
        browser,
      ),
    );
  });
});

describe('writeSvgForBpmn', () => {
  it('writes a sibling svg next to the bpmn file', async () => {
    const browser = await launchBrowser();
    const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'bpmn-svg-'));
    const bpmnPath = path.join(dir, 'process.bpmn');
    fs.copyFileSync(template, bpmnPath);

    try {
      const written = await writeSvgForBpmn(bpmnPath, browser);

      assert.equal(written.svgPath, path.join(dir, 'process.svg'));
      assert.equal(written.markdown, '![process](process.svg)');
      assert.match(fs.readFileSync(written.svgPath, 'utf8'), /<svg/);
    } finally {
      await browser.close();
    }
  });
});

describe('markdownImageFrom', () => {
  it('builds a relative image link from another markdown file', () => {
    const link = markdownImageFrom(
      '/repo/openspec/changes/add-transfer/design.md',
      '/repo/openspec/changes/add-transfer/specs/transfer/process.svg',
      'Transfer',
    );

    assert.equal(link, '![Transfer](specs/transfer/process.svg)');
  });
});
