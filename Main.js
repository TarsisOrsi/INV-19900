// ############ Teste Auto configuravel para Controladores da família INV- 199 #####################

habilitaRastreamento = true

var validadeCookie = 190 // tempo em segundos 
var dateExpCookie = new Date();
var MapTest = new Map()
var Falhas =  new Map ()
var RelatorioTestes= new Map()

function Main() {
    window.sessionStorage.setItem("serialNumber","")

    Ui = new UI()
    Teste = new Teste()
    Teste.ObserverSaidas()
    RastAPI =  new  RastAPI(["TF"],"TF")
    Temperatura = new Temperatura()

    this.MaquinaEstados()
}

Main.prototype.MaquinaEstados = function () {

    Estado = ""

    ME = setInterval(() => { 

        switch (Estado) {
            case "setup":
                SetEstado("############ Configuração do Produto ############")            
                this.ProductConfig("verificaChicote")
                break

            case "verificaChicote":
                SetEstado("############ Confirmação do Chicote ############")
                Ui.telaImagem("rastreamento","padrao.png", "Para prosseguir Utilize:"+
                                                            "\nChicote: "+ MapTest.get("CHICOTE") +
                                                            "\nBase: "+ MapTest.get("BASE")+
                                                            "\nFixture: "+ MapTest.get("FIXTURE"))
                break

            case "rastreamento":
                SetEstado("############ Iniciando o Rastreamento ############")

                RastAPI.start("iniciaTeste","finalizaTeste")
                break

            case "iniciaTeste":
                SetEstado("############ Iniciando o Teste ############")
                
                if (pvi.getVar("_execcount") == 0) {

                    Ui.AbrirImagem(MapTest.get("PS"))

                    Ui.MsgConfirm("Teste "+CodModelo+
                                "\n\nVerifique se o PS está correto conforme imagem."+
                                "\n\nclique em AVANÇA", () => {

                        Ui.AbrirImagem(MapTest.get("AUTOTESTE"))

                        Ui.MsgConfirm("Mantenha as teclas indicadas pressionadas e clique em AVANÇA", () => {
                            SetEstado("Energizacao")
                        })                                    
                    })        
                    
                }else{
                    Ui.AbrirImagem(MapTest.get("AUTOTESTE"))

                    Ui.MsgConfirm("Mantenha as teclas indicadas pressionadas e clique em AVANÇA", () => {
                        SetEstado("Energizacao")
                    }) 
                }
                break

            case "Energizacao":
                SetEstado("############ Energizando a Peça ############")

                Teste.ControlaAlimentacao(MapTest.get("ALIMENTACAO"))

                setTimeout(() => {
                    
                    Ui.AbrirImagem(MapTest.get("SENHA_IMG"))

                    Ui.MsgConfirm("Digite a senha " + MapTest.get("SENHA_NUM") + " utilizando as teclas indicadas..\n\nClique em AVANÇA", () => {
                        Teste.LigaReles(MapTest.get("RELES_INIT"),()=>{
                            setTimeout(() => {
                                SetEstado("BeepExterno")
                            }, 500);
                        })
                    }) 
                }, 5000);

                break
                
            case "saidasAcionadas":         //ESTADO INATIVO, SÓ SERÁ POSSÍVEL APÓS TODOS OS CONTROLADORES INICIALIZAREM COM TODAS SAÍDAS DESACIONADAS.
                SetEstado("############ Testando Saídas Acionadas ############")
                
                Teste.LigaReles(MapTest.get("RELES_INIT"),()=>{

                    var ssr = setInterval(() => {
                        this.TestaSaidas("SAIDAS_SSR","OFF","_INIT")
                    }, 100)
                    
                    setTimeout(() => {
                        Teste.DesligaReles(()=>{
                            clearInterval(ssr)
                            SetEstado("testaSaidasRele")})                        
                    }, 1000)
                })
                break 

            case "BeepExterno":
                SetEstado("############ Testando Beep Externo ############")
                    
                    if (MapTest.get("BEEP_INV")) {
                        if (RelatorioTestes.get("Beep") == "ON") {
                            RelatorioTestes.set("BEEP_INIT","OK")
                        }
                        SetEstado("testaSaidasRele")
    
                    }else if (!MapTest.get("BEEP_INV")) {
                        if (RelatorioTestes.get("Beep") == "OFF") {
                            RelatorioTestes.set("BEEP_INIT","OK")
                        }
                        SetEstado("testaSaidasRele")
    
                    }else if (MapTest.get("BEEP_INV") == "NA") {                    
                        SetEstado("testaSaidasRele")
    
                    } else {
                        Falhas.set("BEEP_EXT_CONFIG","Beep externo não configurado, peça auxilio ao Métodos e Processos.")
                        SetEstado("finalizaTeste")
                    }
                break

            case "testaSaidasRele":
                SetEstado("############ Testando Saídas Relé ############")

                if(MapTest.get("SAIDAS_RELE") != "NA"){
                    Teste.LigaReles(MapTest.get("ALIM_SAIDAS_RELE"),()=>{})

                    Ui.AbrirImagem(MapTest.get("TECLAS"))
                    Ui.MsgAviso("Pressione a(s) tecla(s) conforme imagem\n\nSaída Relé")
    
                    var observerSaidasRele = setInterval(() => {
                        this.TestaSaidas("SAIDAS_RELE","ON","_OK")
                    }, 100)
    
                    setTimeout(() => {
                        clearInterval(observerSaidasRele)
                        SetEstado("Entradas")
                    }, 3000);

                }else{
                    SetEstado("testaSaidasSSR")
                    //SetEstado("Entradas")
                }
                break

            case "testaSaidasSSR":
                SetEstado("############ Testando Saídas SSR ############")

                if (MapTest.get("SAIDAS_SSR") != "NA") {
                    
                    Ui.AbrirImagem("padrao.png")
                    Ui.MsgAviso("")

                    Teste.DesligaReles(()=>{

                        Teste.LigaReles(MapTest.get("ALIM_SAIDAS_SSR"),()=>{
                            
                            let outPullUp = setTimeout(() => {
    
                                Ui.AbrirImagem(MapTest.get("TECLAS"))
                                Ui.MsgAviso("Pressione a(s) tecla(s) conforme imagem\n\nSaída SSR")
    
                                Teste.validarCurtoCircuito(true)
    
                                var ssr = setInterval(() => {
                                    this.TestaSaidas("SAIDAS_SSR","OFF","_OK")
                                }, 100)
    
                                setTimeout(() => {
                                    Teste.DesligaReles(()=>{
                                        clearInterval(ssr)
    
                                    Teste.validarCurtoCircuito(false)
                                        SetEstado("Entradas")
                                    })
                                }, 5000)
                            }, 1000)
                        })
                    })
                } else {
                    SetEstado("Entradas")
                }
                break


            case "Entradas":
                SetEstado("############ Testando Entradas ############")

                    if (document.cookie.includes("ProductCode=11954")) {

                        Teste.DesligaReles(()=>{})

                        Ui.AbrirImagem(MapTest.get("LEDS"))
                        Ui.MsgSN("Verifique: os LEDs indicados acionaram?", (Resp) =>{

                            if(Resp.includes("buttons.yes.click")){
                                RelatorioTestes.set("LEDS","OK")
                                Teste.DesligaReles(()=>{
                                    SetEstado("Temperatura")
                                })

                            }else if(Resp.includes("buttons.no.click")){
                                Falhas.set("LEDS","Alguns LED's não acionaram ou acionaram indevidamente")
                                Teste.DesligaReles(()=>{
                                    SetEstado("Temperatura")
                                })
                            }
                        })

                    } else {
                        
                        Teste.LigaReles([1,5],()=>{
    
                            // var b = setInterval(() => {
                                
                            //     if(MapTest.get("BEEP_INV")) {
                            //         if (RelatorioTestes.get("Beep") == "OFF") {
                            //             RelatorioTestes.set("BEEP_OK",true)
                            //         }
                
                            //     }else if(!MapTest.get("BEEP_INV")) {
                            //         if (RelatorioTestes.get("Beep") == "ON") {
                            //             RelatorioTestes.set("BEEP_OK",true)
                            //         }
                            //     }
    
                            // }, 200);
    
                            // var ob = setTimeout(() => {
                            //     clearInterval(b)
                            //     clearTimeout(ob)
                            // }, 1000);
    
                            setTimeout(() => {
                                if(MapTest.get("BEEP_INV")) {
                                    if (RelatorioTestes.get("Beep") == "OFF") {
                                        RelatorioTestes.set("BEEP_OK",true)
                                    }
                
                                }else if(!MapTest.get("BEEP_INV")) {
                                    if (RelatorioTestes.get("Beep") == "ON") {
                                        RelatorioTestes.set("BEEP_OK",true)
                                    }
                                }
                            }, 1000);
    
                            Ui.AbrirImagem("on.png")
                            Ui.MsgSN("Verifique: os LEDs indicados acionaram?\n\n"+
                                     "O display mostra 'on'?", (Resp) =>{
    
                                if(Resp.includes("buttons.yes.click")){
                                    RelatorioTestes.set("E1","OK")
                                    Teste.DesligaReles(()=>{
                                        SetEstado("Temperatura")
                                    })
    
                                }else if(Resp.includes("buttons.no.click")){
                                    Falhas.set("E1","Falha na entrada digital E1 não acionou")
                                    Falhas.set("LEDS","Alguns LED's não acionaram ou acionaram indevidamente")
                                    Teste.DesligaReles(()=>{
                                        SetEstado("Temperatura")
                                    })
                                }
                            })
                        })
                    }


                break

            case "Temperatura":
                SetEstado("############ Verificação de Temperatura ############")
                this.TemperatureManager(MapTest.get("TERMOPAR"),()=>{
                    SetEstado("Validacao")
                })
                break
            
            case "Validacao":
                SetEstado("############ Validação Final ############")

                this.validaTeste("SAIDAS_RELE",()=>{
                    SetEstado("finalizaTeste")                    
                })
                break

            case "finalizaTeste":
                SetEstado("############ Finalizando Teste ############")

                Ui.FinalizaTeste()
                break
        }
    },300)
}

Main.prototype.ProductConfig = function (nextEtp) {

    if (document.cookie == "") {
        SetEstado("Parar")
        pvi.ui.showErrorReport("Impossível configurar o teste\nConfiguração expirada.\nPressione R\nRegarregue o teste!")
    }
    else

    //#region  Exemplo de configuração [COMPLETO]
        /* 

        "ProductCode=12052"                                     Codigo Effective                                               :string
        CodModelo = "INV-KA2-01-J-H-RRS"                        Modelo do produto                                              :string


        [setup de teste]

        MapTest.set("BASE","BS-21")                             Base utilizada para teste                                     :string
        MapTest.set("CHICOTE","CNV-096")                        Chicote utilizado para teste                                  :string
        MapTest.set("FIXTURE","FX-10")                          Fixture utilizado para teste                                  :string

        [imagens]

        MapTest.set("PS","179V1.png")                           Passar imagem do PS contida na pasta imagens,                 :string
        MapTest.set("AUTOTESTE","autoTeste1.png")               Passar imagem com as teclas para entrada no autoteste         :string
        MapTest.set("LEDS","ledsConfig1.png")                   Imagem para verificação dos LED's. OBS: Conferir a montagem.  :string
        MapTest.set("ALT_TEMP","tempAlt1.png")                  teclas para alternar entre sensores de temperatura            :string               Se vazio, remover linha ? *************

        [inicialização]
        
        MapTest.set("ALIMENTACAO",220)                          Tensão de alimentação do controlador                          :number
        MapTest.set("RELES_INIT",[0])                           Relés do DAQ que necessitem estar ligados ao iniciar o teste  :object [number]      Se vazio, passar: 0
        MapTest.set("BEEP_INV",true)                            Sinal do beep é invertido?                                    :bool                 Se vazio, passar: "NA" (Não se aplica)
        MapTest.set("BEEP_INT",true)                            Controlador possui beep interno? Passar true ou false         :bool

        [temperatura]
        
        MapTest.set("TERMOPAR",["J","K","PT100"])               Passar tipo de sensor Ex: "J","K","PT100" e ou "NTC".         :object [string]      Se vazio, passar: []
        MapTest.set("TEMP_J",[10,25])                           Simular temperaturas diferente dos valores default (mV)       :string               Se vazio, remover linha
        MapTest.set("PTC",[2,6,5])                              Entrada PTC validada através das saídas do controlador        :object [number]      Se vazio, passar: "NA" (Não se aplica)
        MapTest.set("RELES_TERMOPAR",[8])                       Relés do DAQ que configuram controlador para termopar         :object [number]      Se vazio, passar: 0
        MapTest.set("RELES_PT100",[12])                         Relés do DAQ que configuram controlador para PT100            :object [number]      Se vazio, passar: 0
        MapTest.set("RELES_NTC",[8])                            Relés do DAQ que configuram controlador para NTC              :object [number]      Se vazio, passar: 0

        [hardware]

        MapTest.set("SAIDAS_RELE",[3,4])                        Valor referente às entradas AC do DAQ.                        :object [number]      Se vazio, passar: "NA" (Não se aplica)
        MapTest.set("SAIDAS_SSR",[2])                           Valor referente às entradas AC do DAQ.                        :object [number]      Se vazio, passar: "NA" (Não se aplica)
        MapTest.set("ALIM_SAIDAS_RELE",[0])                     Relés do DAQ que alimentam/configuram as saídas a relé        :object [number]      Se vazio, passar: 0
        MapTest.set("ALIM_SAIDAS_SSR",[0])                      Relés do DAQ que alimentam/configuram as saídas SSR           :object [number]      Se vazio, passar: 0
        MapTest.set("SAIDA_12V",[0])                            Entradas DC do DAQ que monitoram as saídas 12V                :object [number]      Se vazio, passar: "NA" (Não se aplica)
        MapTest.set("IGNORAR_SAIDAS",[7,8])                     Saídas em curto que devem ser ignoradas.                      :object [number]      Se vazio, passar: 0
        MapTest.set("CH",1)                                     Valor referente ao sensor do DAQ                              :number               Se vazio, remover linha.
        MapTest.set("E1",1)                                     Relé do DAQ acoplado para acionar a entrada digital           :number               Se vazio, remover linha.
        
        */
    //#endregion

    if (document.cookie.includes("ProductCode=15681")) {  // 1000003407483      INV-KC1-05-N1-H-R20
        CodModelo = "INV-KC1-05-N1-H-R20"

        MapTest.set("BASE","BS-21")
        MapTest.set("CHICOTE","CNV-096")
        MapTest.set("FIXTURE","FX-04")
        MapTest.set("TECLAS","TC4.png")
        MapTest.set("TERMOPAR",["NTC"])
        MapTest.set("RELES_NTC",[0]) 
        MapTest.set("PS","199V3.png")
        MapTest.set("SENHA_NUM","910")
        MapTest.set("SENHA_IMG","senha.png")
        MapTest.set("AUTOTESTE","autoTeste1.png")
        MapTest.set("LEDS","ledsConfig1.png")
        MapTest.set("ALIMENTACAO",220)
        MapTest.set("ALIM_SAIDAS_RELE",[5,2])
        MapTest.set("SAIDAS_RELE",[1])
        MapTest.set("SAIDAS_SSR","NA")
        MapTest.set("E1",[1,5])
        MapTest.set("BEEP_INV","NA")

        SetEstado(nextEtp)
    }
    else
    if (document.cookie.includes("ProductCode=15732")) {  // 1000003407483      INV-KC1-05-N2-H-R20
        CodModelo = "INV-KC1-05-N2-H-R20"

        MapTest.set("BASE","BS-21")
        MapTest.set("CHICOTE","CNV-096")
        MapTest.set("FIXTURE","FX-04")
        MapTest.set("TECLAS","TC4.png")
        MapTest.set("TERMOPAR",["NTC"])
        MapTest.set("RELES_NTC",[0])
        MapTest.set("PS","199V3.png")
        MapTest.set("AUTOTESTE","autoTeste1.png")
        MapTest.set("LEDS","ledsConfig1.png")
        MapTest.set("SENHA_NUM","910")
        MapTest.set("SENHA_IMG","senha.png")
        MapTest.set("ALIMENTACAO",220)
        MapTest.set("ALIM_SAIDAS_RELE",[5,2])
        MapTest.set("SAIDAS_RELE",[1])
        MapTest.set("SAIDAS_SSR","NA")
        MapTest.set("E1",[1,5])
        MapTest.set("BEEP_INV","NA")

        SetEstado(nextEtp)
    }
    else
    if (document.cookie.includes("ProductCode=15870")) {  // 1000003590180      INV-KC6-05-N1-H-R20
        CodModelo = "INV-KC6-05-N1-H-R20"

        MapTest.set("BASE","BS-21")
        MapTest.set("CHICOTE","CNV-096")
        MapTest.set("FIXTURE","FX-14")
        MapTest.set("TECLAS","TC4.png")
        MapTest.set("TERMOPAR",["NTC"])
        MapTest.set("RELES_NTC",[0])
        MapTest.set("PS","199V12.png")
        MapTest.set("AUTOTESTE","autoTeste1.png")
        MapTest.set("LEDS","ledsConfig1.png")
        MapTest.set("SENHA_NUM","910")
        MapTest.set("SENHA_IMG","senha.png")
        MapTest.set("ALIMENTACAO",220)
        MapTest.set("ALIM_SAIDAS_RELE",[5,2])
        MapTest.set("SAIDAS_RELE",[1])
        MapTest.set("SAIDAS_SSR","NA")
        MapTest.set("E1",[1,3])
        MapTest.set("BEEP_INV","NA")

        SetEstado(nextEtp)
    }
    else
    if (document.cookie.includes("ProductCode=15879")) {  // 1000003672130      INV-KC6-05-N2-H-R20
        CodModelo = "INV-KC6-05-N2-H-R20"

        MapTest.set("BASE","BS-21")
        MapTest.set("CHICOTE","CNV-096")
        MapTest.set("FIXTURE","FX-14")
        MapTest.set("TECLAS","TC4.png")
        MapTest.set("TERMOPAR",["NTC"])
        MapTest.set("RELES_NTC",[0])
        MapTest.set("PS","199V12.png")
        MapTest.set("AUTOTESTE","autoTeste1.png")
        MapTest.set("LEDS","ledsConfig1.png")
        MapTest.set("SENHA_NUM","910")
        MapTest.set("SENHA_IMG","senha.png")
        MapTest.set("ALIMENTACAO",220)
        MapTest.set("ALIM_SAIDAS_RELE",[5,2])
        MapTest.set("SAIDAS_RELE",[1])
        MapTest.set("SAIDAS_SSR","NA")
        MapTest.set("E1",[1,3])
        MapTest.set("BEEP_INV","NA")

        SetEstado(nextEtp)
    }
    else
    if (document.cookie.includes("ProductCode=15809")) {  // 1000003478867      INV-YC1-01-J-H-R20-R
        CodModelo = "INV-YC1-01-J-H-R20-R"

        MapTest.set("BASE","BS-21")
        MapTest.set("CHICOTE","CNV-096")
        MapTest.set("FIXTURE","FX-04")
        MapTest.set("TECLAS","TC4.png")
        MapTest.set("SENHA_NUM","123")
        MapTest.set("SENHA_IMG","senha2.png")
        MapTest.set("TERMOPAR",["J"])
        MapTest.set("RELES_TERMOPAR",[5])
        MapTest.set("PS","199V12.png")
        MapTest.set("AUTOTESTE","autoTeste1.png")
        MapTest.set("LEDS","ledsConfig1.png")
        MapTest.set("RELES_INIT",[5]) 
        MapTest.set("ALIMENTACAO",220)
        MapTest.set("ALIM_SAIDAS_RELE",[5,2])
        MapTest.set("SAIDAS_RELE",[1])
        MapTest.set("SAIDAS_SSR","NA")
        MapTest.set("E1",[1,3])
        MapTest.set("BEEP_INV","NA")

        SetEstado(nextEtp)
    }
    else
    if (document.cookie.includes("ProductCode=16600")) {  // 1000004558457      INV-YC1-01-J-H-S
        CodModelo = "INV-YC1-01-J-H-S"

        MapTest.set("BASE","BS-21")
        MapTest.set("CHICOTE","CNV-096")
        MapTest.set("FIXTURE","FX-04")
        MapTest.set("TECLAS","TC4.png")
        MapTest.set("SENHA_NUM","123")
        MapTest.set("SENHA_IMG","senha2.png")
        MapTest.set("TERMOPAR",["J"])
        MapTest.set("RELES_TERMOPAR",[5])
        MapTest.set("PS","199V12.png")
        MapTest.set("AUTOTESTE","autoTeste1.png")
        MapTest.set("LEDS","ledsConfig1.png")
        MapTest.set("RELES_INIT",[5]) 
        MapTest.set("ALIMENTACAO",220)
        MapTest.set("ALIM_SAIDAS_SSR",[2])
        MapTest.set("SAIDAS_RELE","NA")
        MapTest.set("SAIDAS_SSR",[5])
        MapTest.set("E1",[1])
        MapTest.set("BEEP_INV","NA")

        SetEstado(nextEtp)
    }
    else
    if (document.cookie.includes("ProductCode=11954")) {  // 1000003935714      INV-KC1-01-N1-H-R20
        CodModelo = "INV-KC1-01-N1-H-R20"

        MapTest.set("BASE","BS-21")
        MapTest.set("CHICOTE","CNV-096")
        MapTest.set("FIXTURE","FX-04")
        MapTest.set("TECLAS","teclas.gif")
        MapTest.set("SENHA_NUM","123")
        MapTest.set("SENHA_IMG","senha2.png")
        MapTest.set("TERMOPAR",["NTC"])
        MapTest.set("RELES_NTC",[7])
        MapTest.set("PS","199V12.png")  //?????????
        MapTest.set("AUTOTESTE","autoTeste2.png")
        MapTest.set("LEDS","ledsConfig1.png")
        MapTest.set("RELES_INIT",[5]) 
        MapTest.set("ALIMENTACAO",220)
        MapTest.set("ALIM_SAIDAS_RELE",[5,2])
        MapTest.set("SAIDAS_RELE",[1])
        MapTest.set("SAIDAS_SSR","NA")
        MapTest.set("E1",[1,3])
        MapTest.set("BEEP_INV","NA")
        pvi.daq.ntc1("40GRAUS")
        SetEstado(nextEtp)
    }
    else
    if (document.cookie.includes("ProductCode=14778")) {  // 1000003935714      INV-KC1-01-N1-H-R20
        CodModelo = " INV-KC1-01-N2-H-R20"

        MapTest.set("BASE","BS-21")
        MapTest.set("CHICOTE","CNV-096")
        MapTest.set("FIXTURE","FX-04")
        MapTest.set("TECLAS","teclas.gif")
        MapTest.set("SENHA_NUM","123")
        MapTest.set("SENHA_IMG","senha2.png")
        MapTest.set("TERMOPAR",["NTC"])
        MapTest.set("RELES_NTC",[7])
        MapTest.set("PS","199V12.png")
        MapTest.set("AUTOTESTE","autoTeste2.png")
        MapTest.set("LEDS","ledsConfig1.png")
        MapTest.set("RELES_INIT",[5]) 
        MapTest.set("ALIMENTACAO",220)
        MapTest.set("ALIM_SAIDAS_RELE",[5,2])
        MapTest.set("SAIDAS_RELE",[1])
        MapTest.set("SAIDAS_SSR","NA")
        MapTest.set("E1",[1,3])
        MapTest.set("BEEP_INV","NA")
        pvi.daq.ntc1("40GRAUS")
        SetEstado(nextEtp)
    }
    else
    {
        pvi.ui.showErrorReport("Codigo do controlador não encontrado!")
    }
}

Main.prototype.TestaSaidas = function (mapaSaidas, statusAlvo = "ON", sufixoRelatorio) {
    
    var mapa = MapTest.get(mapaSaidas)

    if (mapa != "NA") {
        for (let i = 0; i < mapa.length; i++) {
            mapa.forEach(element => {
                if (RelatorioTestes.get("AC"+element) == statusAlvo) {
                    RelatorioTestes.set("AC"+element+sufixoRelatorio,"OK")
                }
            })
        }        
    }    
}

Main.prototype.validaTeste = function (mapaSaidasRele, callback) {

    /********************* OBSERVAÇÃO:
    /Entradas digitais, sensores de chama e sensores de temperatura 
    /já são validados no momento da chamada do método em seu respectivo estado.
    */

    var rele = MapTest.get(mapaSaidasRele)

    if (rele != "NA") {        
        rele.forEach(element => {
            if (!RelatorioTestes.has("AC"+element+"_OK")) {
                Falhas.set("SAIDA_RELE_AC"+element,"Entrada AC"+element+" do DAQ não acionou.")
            }
        })
    }

    if (MapTest.get("BEEP_INV") != "NA") {        
        if (RelatorioTestes.get("BEEP_INIT") != "OK") {
            Falhas.set("BEEP_EXT","Falha no Beep Externo")
        }
    }

    if (MapTest.get("BEEP_INV") != "NA") {        
        if (!RelatorioTestes.get("BEEP_OK")) {
            Falhas.set("BEEP_EXT","Beep externo não acionou")
        }
    }

    if(MapTest.get("POSSUI_BEEP")){
        if(!RelatorioTestes.has("BEEP_OK")){
            Falhas.set("BEEP")
        }
    }

    callback()
}

SetEstado =  function (estado, wait = 0){
    if(estado == "Parar"){
        clearInterval(ME)
        console.log( "Máquina estados -> " ,estado)
    }else{       
        setTimeout(() => {
            Estado = estado
            console.log( "Máquina estados -> " ,estado)
        }, wait)
    }    
}

Main.prototype.EntradaManager = function (callback) {

    if (MapTest.has("E1")) {
        
        var key = "E1"
    
        var manager = setInterval(() => {
            switch (key) {
                case "E1":
                    key = "Wait"
                    if (MapTest.has("E1")) {
    
                        let rele = MapTest.get("E1")                                
    
                        if (MapTest.get("BEEP_INV")) {                            
                            Teste.testEntradaDown("E1",rele,()=>{
                                if (MapTest.has("E2")) {
                                    key = "E2"
                                }else{
                                    clearTimeout(outManager)
                                    callback()  
                                    clearInterval(manager)
                                } 
                            })
                        
                        } else if(CodModelo == "INV-YC1-01-J-H-R20-R"){
                            pvi.daq.desligaRele(5)
                            Teste.testEntradaUp("E1",rele,()=>{
                                if (MapTest.has("E2")) {
                                    key = "E2"
                                }else{
                                    clearTimeout(outManager)  
                                    callback()
                                    clearInterval(manager)
                                } 
                            })

                        } else if (!MapTest.get("BEEP_INV")) {                            
                            Teste.testEntradaUp("E1",rele,()=>{
                                if (MapTest.has("E2")) {
                                    key = "E2"
                                }else{
                                    clearTimeout(outManager)  
                                    callback()
                                    clearInterval(manager)
                                } 
                            })
                        }else{
                            Falhas.set("BEEP_PARAM","Parâmetro de beep invertido não encontrado")
                        }
                    }                           
                    break;
    
                case "E2":
                    key = "Wait"
                    if (MapTest.has("E2")) {
    
                        let rele = MapTest.get("E2")                                
    
                        if (MapTest.get("BEEP_INV")) {                            
                            Teste.testEntradaDown("E2",rele,()=>{
                                if (MapTest.has("E3")) {
                                    key = "E3"
                                }else{
                                    clearTimeout(outManager)  
                                    callback()
                                    clearInterval(manager)
                                }
                            })
    
                        } else if (!MapTest.get("BEEP_INV")) {                            
                            Teste.testEntradaUp("E2",rele,()=>{
                                if (MapTest.has("E3")) {
                                    key = "E3"
                                }else{
                                    clearTimeout(outManager)  
                                    callback()
                                    clearInterval(manager)
                                }
                            })
                        }else{
                            Falhas.set("BEEP_PARAM","Parâmetro de beep invertido não encontrado")
                        }
                    }                            
                    break;
                
                case "E3":
                    key = "Wait"
                    if (MapTest.has("E3")) {
    
                        let rele = MapTest.get("E3")                                
    
                        if (MapTest.get("BEEP_INV")) {                            
                            Teste.testEntradaDown("E3",rele,()=>{
                                if (MapTest.has("E4")) {
                                    key = "E4"
                                }else{
                                    clearTimeout(outManager)  
                                    callback()
                                    clearInterval(manager)
                                }
                            })
    
                        } else if (!MapTest.get("BEEP_INV")) {                            
                            Teste.testEntradaUp("E3",rele,()=>{
                                if (MapTest.has("E4")) {
                                    key = "E4"
                                }else{
                                    clearTimeout(outManager)  
                                    callback()
                                    clearInterval(manager)
                                }
                            })
                        }else{
                            Falhas.set("BEEP_PARAM","Parâmetro de beep invertido não encontrado")
                        }
                    }                            
                    break;
    
                case "E4":
                    key = "Wait"
                    if (MapTest.has("E4")) {
    
                        let rele = MapTest.get("E4")                                
    
                        if (MapTest.get("BEEP_INV")) {                            
                            Teste.testEntradaDown("E4",rele,()=>{
                                callback()    
                                clearInterval(manager)
                            })
    
                        } else if (!MapTest.get("BEEP_INV")) {                            
                            Teste.testEntradaUp("E4",rele,()=>{
                                callback()    
                                clearInterval(manager)
                            })
                        }else{
                            Falhas.set("BEEP_PARAM","Parâmetro de beep invertido não encontrado")
                        }
                    }                                                                                
                    break;
            
                case "Wait":
                    break
    
                default:
                    key = "Wait"
                    break;
            }
            
        }, 2000);

        var outManager = setTimeout(() => {
            clearInterval(manager)
            callback()
        }, 12000);
    }else{
        callback()
    }

}

Main.prototype.TemperatureManager = function (mapaSensorTemp, callback) {

    var sensor = ""
    var contSensor = 0

    if (mapaSensorTemp.length == 0 ) {        
        sensor = "Wait"
    }else if (mapaSensorTemp.includes("NTC")) {
        sensor = "NTC"
    }else{
        sensor = "Wait"
        if (MapTest.get("ALIMENTACAO") == 12 || MapTest.get("ALIMENTACAO") == 24) {

            Ui.AbrirImagem("teclas.gif")
            Ui.MsgConfirm("Pressione novamente as teclas indicadas antes de prosseguir.\n\nClique em AVANÇA.", () => {
                sensor = "setAmbiente"
            })

        }else{
            sensor = "setAmbiente"
        }
    }
      
    var tpManager = setInterval(() => {
        switch (sensor) {
            case "setAmbiente":
                Temperatura.setAmbiente(()=>{
                    sensor = "verificaAmbiente"
                })
                break

            case "verificaAmbiente":
                sensor = "Wait"

                Temperatura.verificaAmbiente(()=>{
                    if(mapaSensorTemp.includes("J")){
                        sensor = "J"
                    }else if (mapaSensorTemp.includes("K")) {
                        sensor = "K"
                    }else if (mapaSensorTemp.includes("PT100")) {
                        sensor = "PT100"
                    }
                })
                break

            case "J":
                sensor = "Wait"
    
                Teste.LigaReles(MapTest.get("RELES_TERMOPAR"),()=>{

                    Temperatura.setTemperaturaJ(()=>{})
                    Temperatura.termoPar("J", (retorno)=>{

                        Ui.AbrirImagem("padrao.png")
                        Ui.MsgAviso("")

                        if (retorno) {
                            contSensor ++
                            if (mapaSensorTemp.includes("K")) {
                                sensor = "K"
                            }else if (mapaSensorTemp.includes("PT100")) {
                                sensor = "PT100"
                            }
                        }
                    })
                })
                    
                
                break
    
            case "K":
                sensor = "Wait"

                Ui.AbrirImagem(MapTest.get("ALT_TEMP"))
                Ui.MsgAviso("Pressione as teclas indicadas SIMULTANEAMENTE para alternar entre os termopares")

                Teste.LigaReles(MapTest.get("RELES_TERMOPAR"),()=>{

                    Temperatura.setTemperaturaK(()=>{})
                    Temperatura.termoPar("K", (retorno)=>{
    
                        Ui.AbrirImagem("padrao.png")
                        Ui.MsgAviso("")
    
                        if (retorno) {
                            contSensor ++
                            if (mapaSensorTemp.includes("PT100")) {
                                sensor = "PT100"
                            }                        
                        }
                    })  
                })
                break
            
            case "PT100":
                sensor = "Wait"     

                Ui.AbrirImagem(MapTest.get("ALT_TEMP"))
                Ui.MsgAviso("Pressione as teclas indicadas SIMULTANEAMENTE para alternar entre os termopares")

                Teste.LigaReles(MapTest.get("RELES_PT100"),()=>{
                    Temperatura.setPT100(()=>{})
                    Temperatura.termoResistencia("PT100", (retorno)=>{

                        Ui.AbrirImagem("padrao.png")
                        Ui.MsgAviso("")

                        if (retorno) {
                            contSensor ++
                        }
                    })
                })
                break
            
            case "NTC":
                sensor = "Wait"     

                Teste.LigaReles(MapTest.get("RELES_NTC"),()=>{
                    Temperatura.setNTC(()=>{})
                    Temperatura.verificaNTC("NTC", (retorno)=>{

                        Ui.AbrirImagem("padrao.png")
                        Ui.MsgAviso("")

                        if (retorno) {
                            contSensor ++
                        }
                    })
                })
                break

            case "Wait":
                if (contSensor >= mapaSensorTemp.length) {
                    clearTimeout(outTemp)
                    clearInterval(tpManager)
                    callback()
                }
                break

            default:
                sensor = "Wait"
                break
        }
        
    }, 500)

    outTemp = setTimeout(() => {
        Falhas.set("TIMEOUT_TEMP","Tempo de verificação da temperatura excedido.")
        clearInterval(tpManager)
        callback()
    }, 270000)
}