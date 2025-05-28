import 'bootstrap';

const codeSnippets = {
    globals: {
        title: "Bibliotecas e Variáveis Globais",
        code: `#include <Wire.h>
#include <Adafruit_GFX.h>
#include <Adafruit_LEDBackpack.h>

Adafruit_7segment display = Adafruit_7segment();

// Configuração dos pinos
const int btnConfirmar = 2;
const int btnHora = 3;
const int btnAlarme = 4;
const int btnDesligar = 5;
const int buzzer = 13;

// Variáveis do relógio
byte horas = 12;
byte minutos = 0;
byte segundos = 0;
byte alarmeH = 0;
byte alarmeM = 0;
bool alarmeAtivo = true; // Alarme está habilitado por padrão
bool alarmeTocando = false;

// Controles
byte modo = 0; // 0: Normal, 1: Set Hora, 2: Set Min, 3: Set AlarmeH, 4: Set AlarmeM
unsigned long ultimoTempo = 0;
unsigned long ultimoPisca = 0;
bool displayLigado = true;`,
        explanation: "Este bloco inicializa as bibliotecas para o display I2C e gráficos. Define os pinos do Arduino para os botões e o buzzer. As variáveis globais controlam o tempo atual, a configuração do alarme, o modo de operação do relógio (normal, ajuste de hora, ajuste de alarme), e timers para o piscar do display e atualização do relógio."
    },
    setup: {
        title: "Função setup()",
        code: `void setup() {
  pinMode(btnConfirmar, INPUT_PULLUP);
  pinMode(btnHora, INPUT_PULLUP);
  pinMode(btnAlarme, INPUT_PULLUP);
  pinMode(btnDesligar, INPUT_PULLUP);
  pinMode(buzzer, OUTPUT);
  
  display.begin(0x70); // Inicia o display no endereço I2C 0x70
  display.setBrightness(15); // Define o brilho máximo
  mostrarDisplay(); // Mostra o horário inicial
}`,
        explanation: "A função setup() é executada uma vez no início. Ela configura os pinos dos botões como INPUT_PULLUP (ativos em nível baixo) e o pino do buzzer como OUTPUT. O display de 7 segmentos é inicializado (endereço I2C 0x70), seu brilho é definido para o máximo (15), e a hora inicial é exibida."
    },
    'loop-time-mode': {
        title: "Função loop() - Temporização e Modos",
        code: `void loop() {
  unsigned long tempoAtual = millis();
  
  // Atualiza o relógio a cada segundo no modo normal
  if (modo == 0 && tempoAtual - ultimoTempo >= 1000) {
    ultimoTempo = tempoAtual;
    segundos++;
    if (segundos >= 60) {
      segundos = 0;
      minutos++;
      if (minutos >= 60) {
        minutos = 0;
        horas = (horas + 1) % 24;
      }
    }
    mostrarDisplay();
  }

  // Pisca o display nos modos de configuração
  if (modo != 0 && tempoAtual - ultimoPisca >= 500) {
    ultimoPisca = tempoAtual;
    displayLigado = !displayLigado;
    mostrarDisplay();
  }
  // ... (restante do loop: leitura de botões, lógica do alarme)
}`,
        explanation: "A função loop() principal. A primeira parte atualiza o relógio (horas, minutos, segundos) a cada segundo se estiver no modo normal (modo == 0), usando millis() para um controle de tempo não bloqueante. A segunda parte gerencia o piscar do display a cada 500ms se estiver em algum modo de configuração (modo != 0), alternando a variável displayLigado."
    },
    btnHora: {
        title: "Botão: Alterar Hora (btnHora)",
        code: `// ... (dentro do loop(), após a lógica de tempo e pisca)
if (digitalRead(btnHora) == LOW) { // Botão Alterar Hora pressionado
  delay(250); // Debounce
  if (modo == 0) { // Se em modo normal, entra no modo de ajustar hora
    modo = 1;
  } else if (modo == 1) { // Se ajustando hora, incrementa hora
    horas = (horas + 1) % 24;
  } else if (modo == 2) { // Se ajustando minuto, incrementa minuto
    minutos = (minutos + 1) % 60;
  }
  displayLigado = true; // Garante que o display acenda ao pressionar
  ultimoPisca = tempoAtual; // Reseta o timer do pisca para o valor de millis() no início do loop
  mostrarDisplay();
  while(digitalRead(btnHora) == LOW); // Espera soltar o botão
}`,
        explanation: "Este bloco trata o botão 'Alterar Hora'. Se o relógio está no modo normal (0), ele muda para o modo de ajuste de horas (1). Se já está ajustando horas (1), incrementa as horas. Se está ajustando minutos (2), incrementa os minutos. O display é forçado a acender e o timer de pisca é resetado. O delay(250) é para debouncing, e while(...) espera o botão ser liberado."
    },
    btnAlarme: {
        title: "Botão: Configurar Alarme (btnAlarme)",
        code: `// ... (dentro do loop())
if (digitalRead(btnAlarme) == LOW) { // Botão Configurar Alarme pressionado
  delay(250); // Debounce
  if (modo == 0) { // Se em modo normal, entra no modo de ajustar alarme (hora)
    modo = 3;
  } else if (modo == 3) { // Se ajustando hora do alarme, incrementa hora do alarme
    alarmeH = (alarmeH + 1) % 24;
  } else if (modo == 4) { // Se ajustando minuto do alarme, incrementa minuto do alarme
    alarmeM = (alarmeM + 1) % 60;
  }
  displayLigado = true;
  ultimoPisca = tempoAtual; // Reseta o timer do pisca para o valor de millis() no início do loop
  mostrarDisplay();
  while(digitalRead(btnAlarme) == LOW);
}`,
        explanation: "Funciona de forma similar ao 'btnHora', mas para o alarme. No modo normal (0), muda para ajuste da hora do alarme (3). No modo 3, incrementa a hora do alarme. No modo 4 (ajuste do minuto do alarme), incrementa o minuto do alarme."
    },
    btnConfirmar: {
        title: "Botão: Confirmar (btnConfirmar)",
        code: `// ... (dentro do loop())
if (digitalRead(btnConfirmar) == LOW) { // Botão Confirmar pressionado
  delay(250); // Debounce
  if (modo == 1) { // Estava ajustando hora, passa para minuto
    modo = 2;
  } else if (modo == 2) { // Estava ajustando minuto, volta ao normal e zera segundos
    modo = 0;
    segundos = 0;
  } else if (modo == 3) { // Estava ajustando hora do alarme, passa para minuto do alarme
    modo = 4;
  } else if (modo == 4) { // Estava ajustando minuto do alarme, volta ao normal
    modo = 0;
  }
  displayLigado = true;
  mostrarDisplay();
  while(digitalRead(btnConfirmar) == LOW);
}`,
        explanation: "O botão 'Confirmar' avança pelos estágios de configuração. De ajuste de hora (1) para ajuste de minuto (2). De ajuste de minuto (2) de volta ao modo normal (0), zerando os segundos. Similarmente para o alarme: de hora do alarme (3) para minuto do alarme (4), e de minuto do alarme (4) para o modo normal (0)."
    },
    btnDesligar: {
        title: "Botão: Parar Alarme (btnDesligar)",
        code: `// ... (dentro do loop())
if (digitalRead(btnDesligar) == LOW) { // Botão Desligar Alarme pressionado
  noTone(buzzer); // Para o som do buzzer
  alarmeTocando = false; // Indica que o alarme não está mais tocando
  delay(250);
  while(digitalRead(btnDesligar) == LOW);
}`,
        explanation: "Quando o botão 'Parar Alarme' é pressionado, ele imediatamente interrompe qualquer som do buzzer (noTone) e define a flag alarmeTocando como false, para que a melodia não continue ou reinicie."
    },
    alarmLogic: {
        title: "Lógica do Alarme e Melodia",
        code: `// ... (dentro do loop(), geralmente a última verificação de botão/lógica)
// Verifica alarme com sequência musical
if (modo == 0 && alarmeAtivo && horas == alarmeH && minutos == alarmeM && segundos == 0 && !alarmeTocando) {
  alarmeTocando = true;
  
  // Sequência musical (Dó, Ré, Mi, Fá, Sol, Lá, Si, Dó)
  int melodia[] = {262, 294, 330, 349, 392, 440, 494, 523}; // Frequências em Hz
  int duracaoNotas = 200; // Duração de cada nota em ms
  
  for (int repeticao = 0; repeticao < 3 && alarmeTocando; repeticao++) {
    for (int nota = 0; nota < 8 && alarmeTocando; nota++) {
      tone(buzzer, melodia[nota]);
      delay(duracaoNotas);
      noTone(buzzer);
      delay(50); // Pequena pausa entre notas
      
      if (digitalRead(btnDesligar) == LOW) { // Verifica se o botão desligar foi pressionado
        alarmeTocando = false; 
        noTone(buzzer); // Garante que o som pare imediatamente
        break;
      }
    }
    if (!alarmeTocando) break; // Se interrompido, sai da repetição
    delay(300); // Pausa entre sequências
  }
  alarmeTocando = false; // Garante que o estado seja resetado
  noTone(buzzer); // Garante que o som finalizou
}`,
        explanation: "Este bloco verifica se as condições para disparar o alarme são atendidas: modo normal, alarme ativo, hora e minuto atuais coincidem com o alarme, segundos são zero, e o alarme não está já tocando. Se sim, define alarmeTocando para true e toca uma melodia (sequência de notas Dó-Ré-Mi...) no buzzer. A melodia repete 3 vezes, mas pode ser interrompida a qualquer momento pelo botão 'Parar Alarme'."
    },
    displayFunctions: {
        title: "Funções de Display (mostrarDisplay, formatarDisplay)",
        code: `void mostrarDisplay() {
  display.clear();
  
  if (modo == 0 || displayLigado) {
    switch (modo) {
      case 0: formatarDisplay(horas, minutos, segundos % 2 == 0); break;
      case 1: formatarDisplay(horas, minutos, true); break; // Hora piscando (simulado por displayLigado)
      case 2: formatarDisplay(horas, minutos, true); break; // Minuto piscando (simulado por displayLigado)
      case 3: formatarDisplay(alarmeH, alarmeM, true); break; // Alarme Hora piscando
      case 4: formatarDisplay(alarmeH, alarmeM, true); break; // Alarme Minuto piscando
    }
  }
  display.writeDisplay();
}

void formatarDisplay(byte h, byte m, bool colon) {
  display.writeDigitNum(0, h / 10, false); // Dezena da hora
  display.writeDigitNum(1, h % 10, false); // Unidade da hora
  display.drawColon(colon); // Controla os dois pontos centrais
  display.writeDigitNum(3, m / 10, false); // Dezena do minuto
  display.writeDigitNum(4, m % 10, false); // Unidade do minuto
}`,
        explanation: "mostrarDisplay() limpa o display e, com base no modo atual, decide o que exibir. Se estiver em modo de configuração e displayLigado for false (para piscar), o display fica apagado. Caso contrário, chama formatarDisplay() com os valores apropriados (hora/minuto atual ou do alarme). formatarDisplay() formata os números para os quatro dígitos do display e controla se o ':' central está aceso. segundos % 2 == 0 faz o ':' piscar no modo normal."
    }
};

const fullArduinoCodeString = `
#include <Wire.h>
#include <Adafruit_GFX.h>
#include <Adafruit_LEDBackpack.h>

Adafruit_7segment display = Adafruit_7segment();

// Configuração dos pinos
const int btnConfirmar = 2;
const int btnHora = 3;
const int btnAlarme = 4;
const int btnDesligar = 5;
const int buzzer = 13;

// Variáveis do relógio
byte horas = 12;
byte minutos = 0;
byte segundos = 0;
byte alarmeH = 0;
byte alarmeM = 0;
bool alarmeAtivo = true;
bool alarmeTocando = false;

// Controles
byte modo = 0;
unsigned long ultimoTempo = 0;
unsigned long ultimoPisca = 0;
bool displayLigado = true;

void setup() {
  pinMode(btnConfirmar, INPUT_PULLUP);
  pinMode(btnHora, INPUT_PULLUP);
  pinMode(btnAlarme, INPUT_PULLUP);
  pinMode(btnDesligar, INPUT_PULLUP);
  pinMode(buzzer, OUTPUT);
  
  display.begin(0x70);
  display.setBrightness(15);
  mostrarDisplay();
}

void loop() {
  unsigned long tempoAtual = millis();
  
  if (modo == 0 && tempoAtual - ultimoTempo >= 1000) {
    ultimoTempo = tempoAtual;
    segundos++;
    if (segundos >= 60) {
      segundos = 0;
      minutos++;
      if (minutos >= 60) {
        minutos = 0;
        horas = (horas + 1) % 24;
      }
    }
    mostrarDisplay();
  }

  if (modo != 0 && tempoAtual - ultimoPisca >= 500) {
    ultimoPisca = tempoAtual;
    displayLigado = !displayLigado;
    mostrarDisplay();
  }

  if (digitalRead(btnHora) == LOW) {
    delay(250);
    if (modo == 0) {
      modo = 1;
    } else if (modo == 1) {
      horas = (horas + 1) % 24;
    } else if (modo == 2) {
      minutos = (minutos + 1) % 60;
    }
    displayLigado = true;
    ultimoPisca = tempoAtual;
    mostrarDisplay();
    while(digitalRead(btnHora) == LOW);
  }

  if (digitalRead(btnAlarme) == LOW) {
    delay(250);
    if (modo == 0) {
      modo = 3;
    } else if (modo == 3) {
      alarmeH = (alarmeH + 1) % 24;
    } else if (modo == 4) {
      alarmeM = (alarmeM + 1) % 60;
    }
    displayLigado = true;
    ultimoPisca = tempoAtual;
    mostrarDisplay();
    while(digitalRead(btnAlarme) == LOW);
  }

  if (digitalRead(btnConfirmar) == LOW) {
    delay(250);
    if (modo == 1) {
      modo = 2;
    } else if (modo == 2) {
      modo = 0;
      segundos = 0;
    } else if (modo == 3) {
      modo = 4;
    } else if (modo == 4) {
      modo = 0;
    }
    displayLigado = true;
    mostrarDisplay();
    while(digitalRead(btnConfirmar) == LOW);
  }

  if (digitalRead(btnDesligar) == LOW) {
    noTone(buzzer);
    alarmeTocando = false;
    delay(250);
    while(digitalRead(btnDesligar) == LOW);
  }

  // Verifica alarme com sequência musical
  if (modo == 0 && alarmeAtivo && horas == alarmeH && minutos == alarmeM && segundos == 0 && !alarmeTocando) {
    alarmeTocando = true;
    
    // Sequência musical (Dó, Ré, Mi, Fá, Sol, Lá, Si, Dó)
    int melodia[] = {262, 294, 330, 349, 392, 440, 494, 523};
    int duracaoNotas = 200; // Duração de cada nota em ms
    
    // Toca a sequência 3 vezes ou até o alarme ser desligado
    for (int repeticao = 0; repeticao < 3 && alarmeTocando; repeticao++) {
      for (int nota = 0; nota < 8 && alarmeTocando; nota++) {
        tone(buzzer, melodia[nota]);
        delay(duracaoNotas);
        noTone(buzzer);
        delay(50); // Pequena pausa entre notas
        
        // Verifica se o botão desligar foi pressionado
        if (digitalRead(btnDesligar) == LOW) {
          alarmeTocando = false;
          noTone(buzzer);
          break;
        }
      }
      if (!alarmeTocando) break;
      delay(300); // Pausa entre sequências
    }
    
    alarmeTocando = false;
    noTone(buzzer);
  }
}

void mostrarDisplay() {
  display.clear();
  
  if (modo == 0 || displayLigado) {
    switch (modo) {
      case 0:
        formatarDisplay(horas, minutos, segundos % 2 == 0);
        break;
      case 1:
        formatarDisplay(horas, minutos, true);
        break;
      case 2:
        formatarDisplay(horas, minutos, true);
        break;
      case 3:
        formatarDisplay(alarmeH, alarmeM, true);
        break;
      case 4:
        formatarDisplay(alarmeH, alarmeM, true);
        break;
    }
  }
  display.writeDisplay();
}

void formatarDisplay(byte h, byte m, bool colon) {
  display.writeDigitNum(0, h / 10, false);
  display.writeDigitNum(1, h % 10, false);
  display.drawColon(colon);
  display.writeDigitNum(3, m / 10, false);
  display.writeDigitNum(4, m % 10, false);
}
`;


document.addEventListener('DOMContentLoaded', () => {
    const codeModalEl = document.getElementById('codeModal');
    const codeModal = new bootstrap.Modal(codeModalEl);
    
    codeModalEl.addEventListener('show.bs.modal', function (event) {
        const button = event.relatedTarget;
        const codeId = button.getAttribute('data-code-id');
        const snippetData = codeSnippets[codeId];

        document.getElementById('codeModalLabel').textContent = "Código: " + snippetData.title;
        document.getElementById('code-modal-subtitle').textContent = snippetData.title;
        document.getElementById('code-snippet-area').textContent = snippetData.code;
        document.getElementById('code-explanation-area').textContent = snippetData.explanation;
        
        // Se tiver Prism.js ou similar, re-highlight:
        // if (window.Prism) {
        //     Prism.highlightElement(document.getElementById('code-snippet-area'));
        // }
    });

    const fullCodeModalEl = document.getElementById('fullCodeModal');
    if (fullCodeModalEl) { // Check if the element exists
        const fullCodeModal = new bootstrap.Modal(fullCodeModalEl);
        const fullCodeSnippetArea = document.getElementById('full-code-snippet-area');
        const btnShowFullCode = document.getElementById('btn-show-full-code');

        if (btnShowFullCode && fullCodeSnippetArea) {
            btnShowFullCode.addEventListener('click', () => {
                fullCodeSnippetArea.textContent = fullArduinoCodeString.trim();
                // Re-highlight if Prism.js or similar is used and configured for this modal
                // if (window.Prism) {
                //     Prism.highlightElement(fullCodeSnippetArea);
                // }
                // Modal is shown via data-bs-toggle, so no need for fullCodeModal.show() here
            });
        }
    }


    // Simulation Logic
    const sim = {
        horas: 12,
        minutos: 0,
        segundos: 0,
        alarmeH: 0,
        alarmeM: 0,
        alarmeAtivo: true,
        alarmeTocando: false,
        modo: 0, // 0: Normal, 1: Set Hora, 2: Set Min, 3: Set AlarmeH, 4: Set AlarmeM
        displayLigado: true,
        ultimoPisca: Date.now()
    };

    const displayH1 = document.getElementById('sim-h1');
    const displayH2 = document.getElementById('sim-h2');
    const displayColon = document.getElementById('sim-colon');
    const displayM1 = document.getElementById('sim-m1');
    const displayM2 = document.getElementById('sim-m2');
    
    const currentTimeInfo = document.getElementById('current-time-info');
    const alarmTimeInfo = document.getElementById('alarm-time-info');
    const alarmActiveStatus = document.getElementById('alarm-active-status');
    const alarmStatusIndicator = document.getElementById('alarm-status');
    const simModeInfo = document.getElementById('sim-mode-info');


    let audioCtx = null;
    let oscillatorNode = null;
    let gainNode = null;
    const melodyFreq = [262, 294, 330, 349, 392, 440, 494, 523]; // Hz
    const noteDurationSec = 0.2; // seconds
    const notePauseSec = 0.05; // seconds
    let melodyIntervalId = null;
    let currentMelodyNoteIndex = 0;
    let currentMelodyRep = 0;

    function initAudio() {
        if (!audioCtx) {
            audioCtx = new (window.AudioContext || window.webkitAudioContext)();
        }
    }
    
    async function playSimTone(frequency, duration) {
        if (!audioCtx) initAudio();
        if (!audioCtx) return; // AudioContext not supported or not initialized

        return new Promise((resolve) => {
            if (oscillatorNode) { // Stop previous tone if any
                oscillatorNode.stop();
                oscillatorNode.disconnect();
            }
            oscillatorNode = audioCtx.createOscillator();
            gainNode = audioCtx.createGain();
    
            oscillatorNode.connect(gainNode);
            gainNode.connect(audioCtx.destination);
    
            oscillatorNode.type = 'sine';
            oscillatorNode.frequency.setValueAtTime(frequency, audioCtx.currentTime);
            gainNode.gain.setValueAtTime(0.1, audioCtx.currentTime); // Low volume for buzzer
    
            oscillatorNode.start(audioCtx.currentTime);
            oscillatorNode.stop(audioCtx.currentTime + duration);
            oscillatorNode.onended = resolve;
        });
    }

    function stopSimAlarmSound() {
        if (melodyIntervalId) {
            clearInterval(melodyIntervalId);
            melodyIntervalId = null;
        }
        if (oscillatorNode) {
            oscillatorNode.stop();
            oscillatorNode.disconnect();
            oscillatorNode = null;
        }
        sim.alarmeTocando = false;
        alarmStatusIndicator.textContent = 'Alarme Desligado';
        alarmStatusIndicator.classList.remove('active');
        updateSimDisplay();
    }

    async function playSimAlarmMelody() {
        if (sim.alarmeTocando || !audioCtx) return;
        sim.alarmeTocando = true;
        alarmStatusIndicator.textContent = 'Alarme TOCANDO!';
        alarmStatusIndicator.classList.add('active');
        
        currentMelodyNoteIndex = 0;
        currentMelodyRep = 0;

        async function nextNote() {
            if (!sim.alarmeTocando) { // Stopped by user
                stopSimAlarmSound();
                return;
            }
            if (currentMelodyRep >= 3) {
                stopSimAlarmSound();
                return;
            }

            await playSimTone(melodyFreq[currentMelodyNoteIndex], noteDurationSec);

            if (!sim.alarmeTocando) { // Check again if stopped during tone
                stopSimAlarmSound();
                return;
            }

            currentMelodyNoteIndex++;
            if (currentMelodyNoteIndex >= melodyFreq.length) {
                currentMelodyNoteIndex = 0;
                currentMelodyRep++;
                if (currentMelodyRep < 3) {
                    melodyIntervalId = setTimeout(nextNote, (notePauseSec + 0.3) * 1000); // Pause between sequences
                } else {
                    stopSimAlarmSound();
                }
            } else {
                 melodyIntervalId = setTimeout(nextNote, notePauseSec * 1000); // Pause between notes
            }
        }
        nextNote();
    }


    function formatTwoDigits(num) {
        return num.toString().padStart(2, '0');
    }

    function updateSimDisplay() {
        let h_disp = sim.horas;
        let m_disp = sim.minutos;
        let colon_visible = sim.segundos % 2 === 0;

        if (sim.modo === 0) { // Normal
            // Colon blinking is handled by CSS animation if always on, or JS if tied to seconds
             displayColon.style.opacity = colon_visible ? '1' : '0.2';
        } else { // Setting modes
            displayColon.style.opacity = '1'; // Colon always on during settings
        }
        
        // Clear previous blinking states
        [displayH1, displayH2, displayM1, displayM2].forEach(el => {
            el.classList.remove('digit-blink-active', 'blink-off');
        });

        if (sim.modo !== 0) { // In a setting mode
            if (!sim.displayLigado) { // if display should be "off" for blinking
                 if (sim.modo === 1 || sim.modo === 3) { // Blinking Hours
                    displayH1.classList.add('blink-off');
                    displayH2.classList.add('blink-off');
                 } else if (sim.modo === 2 || sim.modo === 4) { // Blinking Minutes
                    displayM1.classList.add('blink-off');
                    displayM2.classList.add('blink-off');
                 }
            }
             // Add active class for potential styling, even if not blinking off this cycle
            if (sim.modo === 1 || sim.modo === 3) { 
                displayH1.classList.add('digit-blink-active');
                displayH2.classList.add('digit-blink-active');
            } else if (sim.modo === 2 || sim.modo === 4) {
                displayM1.classList.add('digit-blink-active');
                displayM2.classList.add('digit-blink-active');
            }
        }


        switch (sim.modo) {
            case 0: // Normal
            case 1: // Set Hora
            case 2: // Set Min
                h_disp = sim.horas;
                m_disp = sim.minutos;
                break;
            case 3: // Set AlarmeH
            case 4: // Set AlarmeM
                h_disp = sim.alarmeH;
                m_disp = sim.alarmeM;
                break;
        }

        const h_str = formatTwoDigits(h_disp);
        const m_str = formatTwoDigits(m_disp);

        displayH1.textContent = h_str[0];
        displayH2.textContent = h_str[1];
        displayM1.textContent = m_str[0];
        displayM2.textContent = m_str[1];

        currentTimeInfo.textContent = `${formatTwoDigits(sim.horas)}:${formatTwoDigits(sim.minutos)}:${formatTwoDigits(sim.segundos)}`;
        alarmTimeInfo.textContent = `${formatTwoDigits(sim.alarmeH)}:${formatTwoDigits(sim.alarmeM)}`;
        alarmActiveStatus.textContent = sim.alarmeAtivo ? 'Ativo' : 'Inativo';

        let modeText = "Normal";
        switch(sim.modo) {
            case 1: modeText = "Ajustar Hora"; break;
            case 2: modeText = "Ajustar Minuto"; break;
            case 3: modeText = "Ajustar Hora Alarme"; break;
            case 4: modeText = "Ajustar Minuto Alarme"; break;
        }
        simModeInfo.textContent = `Modo: ${modeText}`;
    }
    
    // Button Event Listeners
    document.getElementById('btn-sim-hora').addEventListener('click', () => {
        initAudio(); // Ensure audio context is ready on user interaction
        if (sim.modo === 0) sim.modo = 1;
        else if (sim.modo === 1) sim.horas = (sim.horas + 1) % 24;
        else if (sim.modo === 2) sim.minutos = (sim.minutos + 1) % 60;
        
        sim.displayLigado = true;
        sim.ultimoPisca = Date.now();
        updateSimDisplay();
    });

    document.getElementById('btn-sim-alarme').addEventListener('click', () => {
        initAudio();
        if (sim.modo === 0) sim.modo = 3;
        else if (sim.modo === 3) sim.alarmeH = (sim.alarmeH + 1) % 24;
        else if (sim.modo === 4) sim.alarmeM = (sim.alarmeM + 1) % 60;

        sim.displayLigado = true;
        sim.ultimoPisca = Date.now();
        updateSimDisplay();
    });

    document.getElementById('btn-sim-confirmar').addEventListener('click', () => {
        initAudio();
        if (sim.modo === 1) sim.modo = 2;
        else if (sim.modo === 2) { sim.modo = 0; sim.segundos = 0; }
        else if (sim.modo === 3) sim.modo = 4;
        else if (sim.modo === 4) sim.modo = 0;
        
        sim.displayLigado = true;
        updateSimDisplay();
    });

    document.getElementById('btn-sim-desligar').addEventListener('click', () => {
        initAudio();
        stopSimAlarmSound();
    });


    // Main simulation loop
    setInterval(() => {
        const tempoAtualSim = Date.now();

        if (sim.modo === 0) { // Normal mode time update
            sim.segundos++;
            if (sim.segundos >= 60) {
                sim.segundos = 0;
                sim.minutos++;
                if (sim.minutos >= 60) {
                    sim.minutos = 0;
                    sim.horas = (sim.horas + 1) % 24;
                }
            }
        }

        // Blinking logic for setting modes
        if (sim.modo !== 0 && tempoAtualSim - sim.ultimoPisca >= 500) {
            sim.ultimoPisca = tempoAtualSim;
            sim.displayLigado = !sim.displayLigado;
        }
        
        updateSimDisplay();

        // Check Alarm
        if (sim.modo === 0 && sim.alarmeAtivo && sim.horas === sim.alarmeH && sim.minutos === sim.alarmeM && sim.segundos === 0 && !sim.alarmeTocando) {
            playSimAlarmMelody();
        }

    }, 1000);

    updateSimDisplay(); // Initial display
});