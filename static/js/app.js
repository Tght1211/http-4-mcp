/**
 * HTTP-4-MCP 配置工具
 * 前端JavaScript文件
 */

document.addEventListener('DOMContentLoaded', function() {
    // 全局状态
    const state = {
        tools: [],
        currentTool: null,
        editMode: false,
        responseData: null,
        // 默认字段描述映射
        fieldDescriptions: {
            'code': '响应码',
            'data': '数据',
            'name': '名称',
            'type': '类型',
            'money': '钱',
            'price': '价格',
            'color': '颜色',
            'status': '状态',
            'message': '消息',
            'error': '错误',
            'success': '成功',
            'result': '结果',
            'count': '数量',
            'time': '时间',
            'date': '日期',
            'user': '用户',
            'id': '标识符',
            'total': '总计',
        }
    };

    // DOM元素
    const elements = {
        tabItems: document.querySelectorAll('.tab-item'),
        tabContents: document.querySelectorAll('.tab-content'),
        toolsContainer: document.getElementById('tools-container'),
        addToolBtn: document.getElementById('add-tool-btn'),
        toolModal: document.getElementById('tool-modal'),
        toolForm: document.getElementById('tool-form'),
        modalTitle: document.getElementById('modal-title'),
        paramsContainer: document.getElementById('params-container'),
        addParamBtn: document.getElementById('add-param-btn'),
        responseMapping: document.getElementById('response-mapping'),
        headersInput: document.getElementById('headers-input'),
        modalCloseButtons: document.querySelectorAll('.modal-close'),
        reloadBtn: document.getElementById('reload-btn'),
        curlForm: document.getElementById('curl-form'),
        curlCommand: document.getElementById('curl-command'),
        loadingElement: document.getElementById('loading'),
        loadingMessage: document.getElementById('loading-message'),
        testApiBtn: document.getElementById('test-api-btn'),
        responsePreviewModal: document.getElementById('response-preview-modal'),
        responsePreview: document.getElementById('response-preview'),
        applyResponseMappingBtn: document.getElementById('apply-response-mapping-btn'),
        generateFullMappingBtn: document.getElementById('generate-full-mapping-btn'),
        copyResponseBtn: document.getElementById('copy-response-btn'),
    };

    // 初始化
    init();

    function init() {
        // 加载API工具
        loadApiTools();
        
        // 绑定事件
        bindEvents();

        // 设置响应映射占位符
        updateResponseMappingPlaceholder();
    }

    // 绑定事件
    function bindEvents() {
        // 标签页切换
        elements.tabItems.forEach(tab => {
            tab.addEventListener('click', () => {
                const target = tab.dataset.target;
                
                // 激活标签
                elements.tabItems.forEach(item => item.classList.remove('active'));
                tab.classList.add('active');
                
                // 显示内容
                elements.tabContents.forEach(content => {
                    content.style.display = content.id === target ? 'block' : 'none';
                });
            });
        });
        
        // 添加工具按钮
        elements.addToolBtn.addEventListener('click', () => {
            openToolModal();
        });
        
        // 关闭模态框
        elements.modalCloseButtons.forEach(button => {
            button.addEventListener('click', event => {
                const modal = event.target.closest('.modal');
                closeModal(modal);
            });
        });
        
        // 工具表单提交
        elements.toolForm.addEventListener('submit', event => {
            event.preventDefault();
            saveToolForm();
        });
        
        // 添加参数
        elements.addParamBtn.addEventListener('click', () => {
            addParamField();
        });
        
        // 重载配置
        elements.reloadBtn.addEventListener('click', () => {
            reloadConfig();
        });
        
        // cURL表单提交
        elements.curlForm.addEventListener('submit', event => {
            event.preventDefault();
            parseCurlCommand();
        });

        // 测试API按钮
        if (elements.testApiBtn) {
            elements.testApiBtn.addEventListener('click', () => {
                testApiRequest();
            });
        }

        // 应用响应映射按钮
        if (elements.applyResponseMappingBtn) {
            elements.applyResponseMappingBtn.addEventListener('click', () => {
                applyResponseMapping();
            });
        }

        // 生成完整映射按钮
        if (elements.generateFullMappingBtn) {
            elements.generateFullMappingBtn.addEventListener('click', () => {
                generateFullResponseMapping();
            });
        }

        // 复制响应数据按钮
        if (elements.copyResponseBtn) {
            elements.copyResponseBtn.addEventListener('click', () => {
                copyResponseData();
            });
        }
    }

    // 加载API工具列表
    async function loadApiTools() {
        showLoading('加载API工具...');
        
        try {
            const response = await fetch('/api/config');
            
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            
            const data = await response.json();
            state.tools = Array.isArray(data.tools) ? data.tools : [];
            
            renderTools();
        } catch (error) {
            console.error('Failed to load API tools:', error);
            showAlert('加载API工具失败: ' + error.message, 'danger');
        } finally {
            hideLoading();
        }
    }

    // 渲染工具列表
    function renderTools() {
        elements.toolsContainer.innerHTML = '';
        
        if (state.tools.length === 0) {
            elements.toolsContainer.innerHTML = `
                <div class="alert alert-info">
                    <span class="emoji-icon">ℹ️</span>
                    <div>
                        <p>还没有API工具，点击"添加工具"创建第一个工具。</p>
                    </div>
                </div>
            `;
            return;
        }
        
        state.tools.forEach(tool => {
            const toolCard = document.createElement('div');
            toolCard.className = 'tool-card';
            toolCard.dataset.tool = escapeHtml(tool.name);
            
            // 截断长URL以避免溢出
            const displayUrl = escapeHtml(tool.url);
            
            toolCard.innerHTML = `
                <button class="delete-tool-btn" data-tool="${escapeHtml(tool.name)}" title="删除工具">
                    <span class="emoji-icon">🗑️</span>
                </button>
                
                <div class="tool-card-header">
                    <span class="tool-icon">🔧</span>
                    <h3 class="tool-name" title="${escapeHtml(tool.name)}">${escapeHtml(tool.name)}</h3>
                </div>
                
                <div class="tool-card-body">
                    <p class="tool-description" title="${escapeHtml(tool.description)}">${escapeHtml(tool.description)}</p>
                    
                    <div class="tool-details">
                        <div class="tool-detail-item">
                            <span class="tool-detail-label">方法:</span>
                            <span class="tool-detail-value">${escapeHtml(tool.method)}</span>
                        </div>
                        <div class="tool-detail-item url-item">
                            <span class="tool-detail-label">URL:</span>
                            <span class="tool-detail-value" title="${escapeHtml(tool.url)}">${displayUrl}</span>
                        </div>
                        <div class="tool-detail-item">
                            <span class="tool-detail-label">参数:</span>
                            <span class="tool-detail-value badge">${Object.keys(tool.params || {}).length} 个参数</span>
                            <button class="btn-link view-params" data-tool="${escapeHtml(tool.name)}" title="查看参数详情">
                                <span class="emoji-icon">👁️</span> 查看详情
                            </button>
                        </div>
                    </div>
                </div>
            `;
            
            // 整张卡片点击时进入编辑模式
            toolCard.addEventListener('click', (event) => {
                // 如果点击的是查看参数按钮或删除按钮，不触发编辑
                if (!event.target.closest('.view-params') && !event.target.closest('.delete-tool-btn')) {
                    editTool(tool.name);
                }
            });
            
            // 绑定删除按钮事件
            const deleteBtn = toolCard.querySelector('.delete-tool-btn');
            deleteBtn.addEventListener('click', (event) => {
                event.stopPropagation(); // 阻止事件冒泡，避免触发卡片的点击事件
                deleteTool(tool.name);
            });
            
            // 绑定查看参数按钮事件
            const viewParamsBtn = toolCard.querySelector('.view-params');
            viewParamsBtn.addEventListener('click', (event) => {
                event.stopPropagation(); // 阻止事件冒泡，避免触发卡片的点击事件
                toggleToolDetails(tool.name);
            });
            
            elements.toolsContainer.appendChild(toolCard);
        });
    }

    // 初始化参数容器表头
    function initParamsTableHeader() {
        // 清空参数容器
        elements.paramsContainer.innerHTML = '';
        
        // 添加表头
        const headerRow = document.createElement('div');
        headerRow.className = 'params-table-header';
        headerRow.innerHTML = `
            <div class="param-cell">名称</div>
            <div class="param-cell">类型</div>
            <div class="param-cell">必填</div>
            <div class="param-cell">描述</div>
            <div class="param-cell">默认值</div>
            <div class="param-cell param-actions">操作</div>
        `;
        
        elements.paramsContainer.appendChild(headerRow);
    }

    // 打开工具模态框(新增)
    function openToolModal() {
        state.editMode = false;
        state.currentTool = null;
        elements.modalTitle.textContent = '添加新API工具 🛠️';
        elements.toolForm.reset();
        
        // 设置默认响应模式
        const responseModeRadios = elements.toolForm.querySelectorAll('[name="response_mode"]');
        if (responseModeRadios.length) {
            responseModeRadios.forEach(radio => {
                radio.checked = radio.value === 'metadata';
            });
        }
        
        // 初始化参数表头
        initParamsTableHeader();
        
        elements.responseMapping.value = '';
        elements.headersInput.value = '';
        
        // 显示模态框
        elements.toolModal.style.display = 'flex';
        
        // 隐藏测试API按钮 - 仅在编辑模式和cURL导入时显示
        if (elements.testApiBtn) {
            elements.testApiBtn.style.display = 'none';
        }
    }

    // 打开工具模态框(编辑)
    function editTool(toolName) {
        const tool = state.tools.find(t => t.name === toolName);
        
        if (!tool) {
            showAlert(`找不到工具: ${toolName}`, 'danger');
            return;
        }
        
        state.editMode = true;
        state.currentTool = tool;
        
        elements.modalTitle.textContent = `编辑API工具: ${toolName} 🔧`;
        elements.toolForm.reset();
        
        // 填充表单
        elements.toolForm.querySelector('[name="name"]').value = tool.name;
        elements.toolForm.querySelector('[name="description"]').value = tool.description;
        elements.toolForm.querySelector('[name="url"]').value = tool.url;
        elements.toolForm.querySelector('[name="method"]').value = tool.method;
        
        // 设置响应模式
        const responseModeRadios = elements.toolForm.querySelectorAll('[name="response_mode"]');
        if (responseModeRadios.length) {
            responseModeRadios.forEach(radio => {
                if (radio.value === (tool.response_mode || 'metadata')) {
                    radio.checked = true;
                }
            });
        }
        
        // 初始化参数表头
        initParamsTableHeader();
        
        // 参数
        if (tool.params) {
            for (const [name, param] of Object.entries(tool.params)) {
                addParamField(name, param.type, param.desc, param.required, param.default);
            }
        }
        
        // 响应映射
        if (tool.response) {
            const mappings = [];
            for (const [key, value] of Object.entries(tool.response)) {
                // 适配新格式（带有path和desc）和旧格式（字符串）
                if (typeof value === 'string') {
                    mappings.push(`${key}: ${value}`);
                } else if (value && value.path) {
                    // 如果有描述，添加注释
                    mappings.push(`${key}: ${value.path} // ${value.desc}`);
                }
            }
            elements.responseMapping.value = mappings.join('\n');
        } else {
            elements.responseMapping.value = '';
        }
        
        // 请求头
        if (tool.headers) {
            const headers = [];
            for (const [key, value] of Object.entries(tool.headers)) {
                headers.push(`${key}: ${value}`);
            }
            elements.headersInput.value = headers.join('\n');
        } else {
            elements.headersInput.value = '';
        }
        
        // 显示模态框
        elements.toolModal.style.display = 'flex';
        
        // 显示测试API按钮
        if (elements.testApiBtn) {
            elements.testApiBtn.style.display = 'inline-flex';
        }
    }

    // 关闭模态框
    function closeModal(modal) {
        if (modal) {
            modal.style.display = 'none';
        }
    }

    // 添加参数字段
    function addParamField(name = '', type = 'string', desc = '', required = false, defaultValue = '') {
        const paramId = `param-${Date.now()}`;
        const paramField = document.createElement('div');
        paramField.className = 'param-field-compact';
        paramField.dataset.id = paramId;
        
        paramField.innerHTML = `
            <div class="param-table-row">
                <div class="param-cell">
                    <input type="text" class="form-input param-name" value="${escapeHtml(name)}" placeholder="参数名称">
                </div>
                
                <div class="param-cell">
                    <select class="form-input param-type">
                        <option value="string" ${type === 'string' ? 'selected' : ''}>string</option>
                        <option value="number" ${type === 'number' ? 'selected' : ''}>number</option>
                        <option value="boolean" ${type === 'boolean' ? 'selected' : ''}>boolean</option>
                        <option value="object" ${type === 'object' ? 'selected' : ''}>object</option>
                        <option value="array" ${type === 'array' ? 'selected' : ''}>array</option>
                    </select>
                </div>
                
                <div class="param-cell">
                    <select class="form-input param-required">
                        <option value="true" ${required ? 'selected' : ''}>✓</option>
                        <option value="false" ${!required ? 'selected' : ''}>✗</option>
                    </select>
                </div>
                
                <div class="param-cell">
                    <input type="text" class="form-input param-desc" value="${escapeHtml(desc)}" placeholder="参数描述">
                </div>
                
                <div class="param-cell">
                    <input type="text" class="form-input param-default" value="${escapeHtml(defaultValue)}" placeholder="默认值">
                </div>
                
                <div class="param-cell param-actions">
                    <button type="button" class="btn btn-danger btn-sm remove-param" data-id="${paramId}">
                        <span class="emoji-icon">🗑️</span>
                    </button>
                </div>
            </div>
        `;
        
        // 绑定删除参数按钮
        const removeBtn = paramField.querySelector('.remove-param');
        removeBtn.addEventListener('click', () => {
            paramField.remove();
        });
        
        elements.paramsContainer.appendChild(paramField);
    }

    // 保存工具表单
    async function saveToolForm() {
        // 收集表单数据
        const formData = {
            name: elements.toolForm.querySelector('[name="name"]').value.trim(),
            description: elements.toolForm.querySelector('[name="description"]').value.trim(),
            url: elements.toolForm.querySelector('[name="url"]').value.trim(),
            method: elements.toolForm.querySelector('[name="method"]').value,
            params: {},
            headers: {},
            response: {},
            response_mode: elements.toolForm.querySelector('[name="response_mode"]:checked').value || 'metadata'
        };
        
        // 参数
        const paramFields = elements.paramsContainer.querySelectorAll('.param-field-compact');
        paramFields.forEach(field => {
            const name = field.querySelector('.param-name').value.trim();
            if (name) {
                formData.params[name] = {
                    type: field.querySelector('.param-type').value,
                    desc: field.querySelector('.param-desc').value.trim(),
                    required: field.querySelector('.param-required').value === 'true',
                    default: field.querySelector('.param-default').value.trim()
                };
            }
        });
        
        // 响应映射
        const mappings = elements.responseMapping.value.trim().split('\n');
        mappings.forEach(mapping => {
            // 匹配可能带有注释的映射行
            const match = mapping.match(/^([^:]+):\s*([^/]+)(?:\/\/\s*(.+))?$/);
            if (match) {
                const [, key, pathRaw, descRaw] = match;
                const trimmedKey = key.trim();
                const path = pathRaw.trim();
                const desc = descRaw ? descRaw.trim() : null;
                
                if (desc) {
                    // 新格式：包含描述
                    formData.response[trimmedKey] = {
                        path: path,
                        desc: desc
                    };
                } else {
                    // 旧格式：仅包含路径
                    formData.response[trimmedKey] = path;
                }
            }
        });
        
        // 请求头
        const headers = elements.headersInput.value.trim().split('\n');
        headers.forEach(header => {
            const match = header.match(/^([^:]+):\s*(.+)$/);
            if (match) {
                const [, key, value] = match;
                formData.headers[key.trim()] = value.trim();
            }
        });
        
        // 验证数据
        if (!formData.name) {
            showAlert('请输入工具名称', 'warning');
            return;
        }
        
        if (!formData.url) {
            showAlert('请输入API URL', 'warning');
            return;
        }
        
        // 保存数据
        showLoading('保存API工具...');
        
        try {
            let endpoint = '/api/tool';
            let method = 'POST';
            let body = formData;
            let actionType = '添加'; // 默认为添加操作

            console.log('Save mode:', state.editMode, 'Current tool:', state.currentTool ? state.currentTool.name : 'none');
            
            if (state.editMode && state.currentTool) {
                // 编辑现有工具
                endpoint = '/api/config';
                method = 'POST';
                actionType = '更新';
                
                // 获取当前工具配置，然后更新要修改的工具
                const updatedTools = [...state.tools];
                const toolIndex = updatedTools.findIndex(t => t.name === state.currentTool.name);
                
                if (toolIndex >= 0) {
                    updatedTools[toolIndex] = formData;
                } else {
                    // 如果没找到工具，添加为新工具
                    updatedTools.push(formData);
                }
                
                body = { tools: updatedTools };
            } else if (state.currentTool) {
                // cURL导入模式 - 直接添加新工具
                actionType = '添加';
                endpoint = '/api/tool';
                method = 'POST';
                body = formData;
            }
            
            const response = await fetch(endpoint, {
                method: method,
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(body)
            });
            
            if (!response.ok) {
                // 尝试解析错误响应为JSON
                let errorText = await response.text();
                let errorDetail = "未知错误";
                
                try {
                    const errorJson = JSON.parse(errorText);
                    errorDetail = errorJson.detail || errorText;
                } catch (parseError) {
                    errorDetail = errorText || `HTTP error! status: ${response.status}`;
                }
                
                throw new Error(errorDetail);
            }
            
            const responseData = await response.json();
            console.log('保存成功:', responseData);
            
            // 重新加载工具列表
            await loadApiTools();
            
            // 关闭模态框
            closeModal(elements.toolModal);
            
            showAlert(`API工具 "${formData.name}" 已${actionType}`, 'success');
        } catch (error) {
            console.error('Failed to save API tool:', error);
            showAlert(`保存API工具失败: ${error.message}`, 'danger');
        } finally {
            hideLoading();
        }
    }

    // 删除工具
    async function deleteTool(toolName) {
        if (!confirm(`确定要删除API工具 "${toolName}" 吗？此操作不可撤销。`)) {
            return;
        }
        
        showLoading(`删除API工具: ${toolName}...`);
        
        try {
            const response = await fetch(`/api/tool/${toolName}`, {
                method: 'DELETE'
            });
            
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            
            await response.json();
            
            // 重新加载工具列表
            await loadApiTools();
            
            showAlert(`API工具 "${toolName}" 已删除`, 'success');
        } catch (error) {
            console.error('Failed to delete API tool:', error);
            showAlert(`删除API工具失败: ${error.message}`, 'danger');
        } finally {
            hideLoading();
        }
    }

    // 切换工具详情
    function toggleToolDetails(toolName) {
        // 实现查看工具参数详情的功能
        const tool = state.tools.find(t => t.name === toolName);
        
        if (!tool) {
            return;
        }
        
        // 创建模态框
        const detailsModal = document.createElement('div');
        detailsModal.className = 'modal';
        detailsModal.style.display = 'block';
        
        let detailsHTML = '';
        
        if (Object.keys(tool.params || {}).length > 0) {
            detailsHTML = `
                <div class="params-container-wrapper">
                    <div class="params-table-header">
                        <div class="param-cell">名称</div>
                        <div class="param-cell">类型</div>
                        <div class="param-cell">必填</div>
                        <div class="param-cell">描述</div>
                        <div class="param-cell">默认值</div>
                    </div>
                    <div class="params-container">
            `;
            
            for (const [name, param] of Object.entries(tool.params)) {
                detailsHTML += `
                    <div class="param-field-compact">
                        <div class="param-table-row">
                            <div class="param-cell">${escapeHtml(name)}</div>
                            <div class="param-cell">${escapeHtml(param.type)}</div>
                            <div class="param-cell">${param.required ? '✓' : '✗'}</div>
                            <div class="param-cell">${escapeHtml(param.desc)}</div>
                            <div class="param-cell">${param.default ? escapeHtml(param.default) : '-'}</div>
                        </div>
                    </div>
                `;
            }
            
            detailsHTML += `
                    </div>
                </div>
            `;
        } else {
            detailsHTML = `
                <div class="alert alert-info">
                    <span class="emoji-icon">ℹ️</span>
                    <div>
                        <p>此API没有参数</p>
                    </div>
                </div>
            `;
        }
        
        if (tool.response) {
            const mappings = [];
            for (const [key, value] of Object.entries(tool.response)) {
                if (typeof value === 'string') {
                    mappings.push(`${key}: ${value}`);
                } else if (value && value.path) {
                    if (value.desc) {
                        mappings.push(`${key}: ${value.path} // ${value.desc}`);
                    } else {
                        mappings.push(`${key}: ${value.path}`);
                    }
                }
            }
            detailsHTML += `
                <div class="tool-section">
                    <h4>响应映射</h4>
                    <pre class="tool-detail-code">${mappings.join('\n')}</pre>
                </div>
            `;
            
            // 显示响应模式
            const responseMode = tool.response_mode || 'metadata';
            const responseModeText = responseMode === 'normal' ? '普通模式' : '元数据模式';
            detailsHTML += `
                <div class="tool-section">
                    <h4>响应模式</h4>
                    <div class="tool-detail-item">
                        <span class="tool-detail-value badge ${responseMode === 'normal' ? 'badge-primary' : 'badge-success'}">${responseModeText}</span>
                        <p class="tool-detail-desc">
                            ${responseMode === 'normal' ? 
                              '直接返回映射后的数据' : 
                              '在__metadata__字段中返回带有字段路径描述的数据'}
                        </p>
                    </div>
                </div>
            `;
        }
        
        detailsModal.innerHTML = `
            <div class="modal-content pixel-border">
                <div class="modal-header">
                    <h3 class="modal-title">${escapeHtml(tool.name)} - 参数详情 📊</h3>
                    <button class="modal-close">&times;</button>
                </div>
                
                <div class="modal-body">
                    ${detailsHTML}
                </div>
                
                <div class="form-actions">
                    <button type="button" class="btn btn-primary modal-close">
                        <span class="emoji-icon">👍</span> 确定
                    </button>
                </div>
            </div>
        `;
        
        // 绑定关闭按钮
        const closeButtons = detailsModal.querySelectorAll('.modal-close');
        closeButtons.forEach(button => {
            button.addEventListener('click', () => {
                detailsModal.remove();
            });
        });
        
        document.body.appendChild(detailsModal);
    }

    // 重载配置
    async function reloadConfig() {
        showLoading('重载API配置...');
        
        try {
            const response = await fetch('/api/reload', {
                method: 'POST'
            });
            
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            
            const data = await response.json();
            
            showAlert('API配置已重载: ' + data.message, 'success');
        } catch (error) {
            console.error('Failed to reload configuration:', error);
            showAlert('重载API配置失败: ' + error.message, 'danger');
        } finally {
            hideLoading();
        }
    }

    // 解析cURL命令
    async function parseCurlCommand() {
        const curlCommand = elements.curlCommand.value.trim();
        
        if (!curlCommand) {
            showAlert('请输入cURL命令', 'warning');
            return;
        }
        
        showLoading('解析cURL命令...');
        
        try {
            // 预处理命令 - 处理多行命令（将反斜杠+换行替换为空格）
            const processedCommand = curlCommand.replace(/\\\s*\n/g, ' ');

            // 提取HTTP方法
            let method = 'GET';
            const methodMatch = processedCommand.match(/-X\s+([A-Z]+)/i);
            if (methodMatch) {
                method = methodMatch[1].toUpperCase();
            }
            
            // 提取URL
            let url = '';
            const urlMatches = processedCommand.match(/(?:(?:https?|ftp|file):\/\/|www\.|ftp\.)[^\s'"]+/g);
            if (urlMatches && urlMatches.length > 0) {
                // 使用最后匹配的URL（通常是正确的）
                url = urlMatches[urlMatches.length - 1].replace(/^['"]|['"]$/g, '');
            } else {
                // 尝试匹配单引号或双引号中的URL
                const quotedUrlMatch = processedCommand.match(/(?:curl\s+|(?:-[A-Za-z]+\s+)+)['"]([^'"]+)['"]/);
                if (quotedUrlMatch) {
                    url = quotedUrlMatch[1];
                }
            }
            
            if (!url) {
                throw new Error('无法从cURL命令提取URL');
            }
            
            // 解析URL参数
            const urlObj = new URL(url);
            const params = {};
            urlObj.searchParams.forEach((value, key) => {
                params[key] = {
                    type: 'string',
                    desc: `参数: ${key}`,
                    required: true,
                    default: value
                };
            });
            
            // 清除URL中的查询参数
            urlObj.search = '';
            const baseUrl = urlObj.toString();
            
            // 提取请求头
            const headers = {};
            const headerMatches = processedCommand.match(/-H\s+['"]([^'"]+)['"]/g) || [];
            headerMatches.forEach(match => {
                const headerMatch = match.match(/-H\s+['"]([^:]+):\s*(.+)['"]/);
                if (headerMatch) {
                    const [, key, value] = headerMatch;
                    headers[key.trim()] = value.trim();
                }
            });
            
            // 创建工具名称
            const pathParts = urlObj.pathname.split('/').filter(Boolean);
            let toolName = pathParts.length > 0 ? pathParts[pathParts.length - 1] : 'api';
            
            // 如果在Authorization头中有token，使用主机名作为前缀
            if (headers['Authorization'] && headers['Authorization'].startsWith('Bearer ')) {
                toolName = `${urlObj.hostname}_${toolName}`;
            }
            
            // 创建默认响应映射的样例 (新增)
            const defaultResponse = {
                "status": "status",
                "message": "message",
                "result@arr": "data.result" // 使用@arr后缀表示数组
            };
            
            // 创建工具对象
            const tool = {
                name: toolName,
                description: `API for ${urlObj.hostname}${urlObj.pathname}`,
                url: baseUrl,
                method: method,
                params: params,
                headers: headers,
                response: defaultResponse // 提供默认响应映射样例
            };
            
            // 使用cURL导入模式 - 这不是编辑模式，但我们有当前工具
            state.editMode = false;
            state.currentTool = tool;
            
            elements.modalTitle.textContent = '添加从cURL导入的API工具 🔍';
            elements.toolForm.reset();
            
            // 填充表单 - 与editTool保持相同的填充逻辑
            elements.toolForm.querySelector('[name="name"]').value = tool.name;
            elements.toolForm.querySelector('[name="description"]').value = tool.description;
            elements.toolForm.querySelector('[name="url"]').value = tool.url;
            elements.toolForm.querySelector('[name="method"]').value = tool.method;
            
            // 设置响应模式
            const responseModeRadios = elements.toolForm.querySelectorAll('[name="response_mode"]');
            if (responseModeRadios.length) {
                responseModeRadios.forEach(radio => {
                    if (radio.value === (tool.response_mode || 'metadata')) {
                        radio.checked = true;
                    }
                });
            }
            
            // 初始化参数表头
            initParamsTableHeader();
            
            // 参数
            if (tool.params) {
                for (const [name, param] of Object.entries(tool.params)) {
                    addParamField(name, param.type, param.desc, param.required, param.default);
                }
            }
            
            // 响应映射
            if (tool.response) {
                const mappings = [];
                for (const [key, value] of Object.entries(tool.response)) {
                    // 适配新格式（带有path和desc）和旧格式（字符串）
                    if (typeof value === 'string') {
                        mappings.push(`${key}: ${value}`);
                    } else if (value && value.path) {
                        // 如果有描述，添加注释
                        if (value.desc) {
                            mappings.push(`${key}: ${value.path} // ${value.desc}`);
                        } else {
                            mappings.push(`${key}: ${value.path}`);
                        }
                    }
                }
                elements.responseMapping.value = mappings.join('\n');
            } else {
                elements.responseMapping.value = '';
            }
            
            // 请求头
            if (tool.headers) {
                const headers = [];
                for (const [key, value] of Object.entries(tool.headers)) {
                    headers.push(`${key}: ${value}`);
                }
                elements.headersInput.value = headers.join('\n');
            } else {
                elements.headersInput.value = '';
            }
            
            // 显示模态框
            elements.toolModal.style.display = 'flex';
            
            // 显示测试API按钮 - 确保在cURL导入时也显示
            if (elements.testApiBtn) {
                elements.testApiBtn.style.display = 'inline-flex';
            }
            
            showAlert('cURL命令解析成功，请检查并确认配置信息', 'success');
        } catch (error) {
            console.error('Failed to parse cURL command:', error);
            showAlert('解析cURL命令失败: ' + error.message, 'danger');
        } finally {
            hideLoading();
        }
    }

    // 测试API请求
    async function testApiRequest() {
        // 收集当前表单中的API数据
        const url = elements.toolForm.querySelector('[name="url"]').value.trim();
        const method = elements.toolForm.querySelector('[name="method"]').value;
        
        if (!url) {
            showAlert('请输入API URL进行测试', 'warning');
            return;
        }

        // 收集参数定义
        const params = {};
        const paramFields = elements.paramsContainer.querySelectorAll('.param-field-compact');
        paramFields.forEach(field => {
            const name = field.querySelector('.param-name').value.trim();
            if (name) {
                params[name] = {
                    type: field.querySelector('.param-type').value,
                    default: field.querySelector('.param-default').value.trim(),
                    required: field.querySelector('.param-required').value === 'true'
                };
            }
        });

        // 获取请求头
        const headersText = elements.headersInput.value.trim();
        const headers = {};
        
        if (headersText) {
            const headerLines = headersText.split('\n');
            headerLines.forEach(line => {
                const match = line.match(/^([^:]+):\s*(.+)$/);
                if (match) {
                    const [, key, value] = match;
                    headers[key.trim()] = value.trim();
                }
            });
        }

        // 创建临时的参数表单让用户可以修改测试值
        // 创建一个包含所有参数的测试表单模态框
        const testParamsModal = document.createElement('div');
        testParamsModal.className = 'modal';
        testParamsModal.id = 'test-params-modal';
        
        let testParamsForm = `
            <div class="modal-content pixel-border">
                <div class="modal-header">
                    <h3 class="modal-title">测试API参数设置 🧪</h3>
                    <button class="modal-close">&times;</button>
                </div>
                <div class="modal-body">
                    <form id="test-params-form">
                        <div class="grid-columns">
        `;
        
        // 添加每个参数的输入字段
        for (const [name, param] of Object.entries(params)) {
            testParamsForm += `
                <div class="form-group">
                    <label class="form-label">${escapeHtml(name)} ${param.required ? '<span class="required-mark">*</span>' : ''}</label>
                    <input type="text" name="param-${name}" class="form-input" 
                           value="${escapeHtml(param.default)}" 
                           placeholder="${param.required ? '必填参数' : '可选参数'}" 
                           ${param.required ? 'required' : ''}>
                </div>
            `;
        }
        
        // 如果没有参数，显示提示
        if (Object.keys(params).length === 0) {
            testParamsForm += `
                <div class="alert alert-info">
                    <span class="emoji-icon">ℹ️</span>
                    <div>
                        <p>此API没有定义参数</p>
                    </div>
                </div>
            `;
        }
        
        testParamsForm += `
                        </div>
                    </form>
                </div>
                <div class="form-actions">
                    <button type="button" id="confirm-test-api" class="btn btn-primary btn-pixel">
                        <span class="emoji-icon">✅</span> 确认并测试
                    </button>
                    <button type="button" class="btn btn-danger modal-close">
                        <span class="emoji-icon">❌</span> 取消
                    </button>
                </div>
            </div>
        `;
        
        testParamsModal.innerHTML = testParamsForm;
        document.body.appendChild(testParamsModal);
        
        // 绑定关闭按钮
        const closeButtons = testParamsModal.querySelectorAll('.modal-close');
        closeButtons.forEach(button => {
            button.addEventListener('click', () => {
                testParamsModal.remove();
            });
        });
        
        // 确认测试按钮
        const confirmButton = testParamsModal.querySelector('#confirm-test-api');
        confirmButton.addEventListener('click', async () => {
            // 收集参数值
            const testValues = {};
            for (const name of Object.keys(params)) {
                const input = testParamsModal.querySelector(`[name="param-${name}"]`);
                if (input && input.value.trim()) {
                    testValues[name] = input.value.trim();
                }
            }
            
            // 关闭测试参数模态框
            testParamsModal.remove();
            
            // 执行API测试
            await executeApiTest(url, method, headers, testValues);
        });
        
        // 显示模态框
        testParamsModal.style.display = 'flex';
    }

    // 执行API测试请求
    async function executeApiTest(url, method, headers, params) {
        // 构建API请求
        const requestData = {
            url,
            method,
            headers,
            params
        };

        // 根据方法处理参数
        if (method === 'GET') {
            // 对于GET请求，参数将作为URL查询参数发送
            const urlObj = new URL(url);
            Object.keys(params).forEach(key => {
                if (params[key]) {
                    urlObj.searchParams.append(key, params[key]);
                }
            });
            requestData.url = urlObj.toString();
        } else if (method === 'POST' || method === 'PUT') {
            // 对于POST或PUT请求，参数将作为JSON主体发送
            requestData.body = params;
        }

        showLoading('正在测试API...');
        
        try {
            // 发送测试请求
            const response = await fetch('/api/test_request', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(requestData)
            });
            
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            
            const result = await response.json();
            
            if (!result.success) {
                throw new Error(result.error || '测试API请求失败');
            }
            
            // 保存响应数据
            state.responseData = result.data;
            
            // 格式化并显示JSON响应
            const formattedJson = JSON.stringify(result.data, null, 2);
            elements.responsePreview.textContent = formattedJson;
            
            // 显示响应预览模态框
            elements.responsePreviewModal.style.display = 'flex';
            
            // 尝试生成响应映射建议
            if (typeof result.data === 'object' && result.data !== null) {
                const mappingSuggestions = extractSampleMappings(result.data);
                
                // 在应用按钮中保存映射建议
                elements.applyResponseMappingBtn.dataset.mapping = mappingSuggestions.join('\n');
            }
            
            showAlert('API测试成功!', 'success');
            
        } catch (error) {
            console.error('Failed to test API:', error);
            showAlert('测试API失败: ' + error.message, 'danger');
        } finally {
            hideLoading();
        }
    }

    // 从响应数据中提取映射建议
    function extractSampleMappings(data, prefix = '') {
        const mappings = [];
        
        function processMappings(obj, path = '') {
            if (obj === null || obj === undefined) return;
            
            if (typeof obj === 'object') {
                if (Array.isArray(obj)) {
                    // 对于数组，添加@arr后缀映射
                    const outputField = path.replaceAll('.', '_') + '@arr';
                    mappings.push(`${outputField}: ${path} // 数组类型数据`);
                    
                    // 如果数组不为空且第一个元素是对象，为其属性添加@arr_格式的映射
                    if (obj.length > 0 && typeof obj[0] === 'object' && obj[0] !== null) {
                        // 处理数组中第一个对象的属性
                        for (const [key, value] of Object.entries(obj[0])) {
                            const outputField = `${path.replaceAll('.', '_')}@arr_${key}`;
                            const propertyPath = `${path}.${key}`;
                            mappings.push(`${outputField}: ${propertyPath} // 数组${path}中每个对象的"${key}"属性`);
                        }
                    }
                } else {
                    // 添加当前对象的映射，如果不是根对象
                    if (path) {
                        const outputField = path.replaceAll('.', '_');
                        mappings.push(`${outputField}: ${path} // 对象类型数据`);
                    }
                    
                    // 处理对象的每个属性
                    for (const [key, value] of Object.entries(obj)) {
                        const newPath = path ? `${path}.${key}` : key;
                        
                        if (typeof value === 'object' && value !== null) {
                            processMappings(value, newPath);
                        } else {
                            // 将路径中的点替换为下划线作为输出字段名
                            const outputField = newPath.replaceAll('.', '_');
                            // 添加值类型作为描述
                            const valueType = typeof value;
                            mappings.push(`${outputField}: ${newPath} // ${valueType}类型数据${valueType === 'number' ? '，单位未知' : ''}`);
                        }
                    }
                }
            }
        }
        
        processMappings(data, prefix);
        
        // 移除可能的重复项
        return [...new Set(mappings)];
    }

    // 应用响应映射
    function applyResponseMapping() {
        const mappingText = elements.applyResponseMappingBtn.dataset.mapping;
        
        if (mappingText) {
            // 清除当前的响应映射内容
            elements.responseMapping.value = '';
            
            // 添加新的映射建议
            elements.responseMapping.value = mappingText;
            
            // 关闭响应预览模态框
            closeModal(elements.responsePreviewModal);
            
            showAlert('响应映射已应用到表单', 'success');
        } else {
            showAlert('无法应用响应映射，未找到映射建议', 'warning');
        }
    }

    // 生成完整响应映射
    function generateFullResponseMapping() {
        if (!state.responseData) {
            showAlert('没有可用的响应数据', 'warning');
            return;
        }

        try {
            // 测试示例数据（如果没有实际响应数据）
            let dataToMap = state.responseData;
            if (!dataToMap) {
                dataToMap = {
                    "code": 200,  
                    "data": {
                        "name": "xiaomi",
                        "type": "card",
                        "money": 210000,
                        "color": [
                            "red",
                            "black"
                        ],
                        "lun": [
                            {
                                "price": 21,
                                "color": "red"
                            },
                            {
                                "price": 22,
                                "red": "black"
                            }
                        ]
                    }
                };
            }
            
            // 创建一个完整的映射对象格式
            const fullMappingsObj = extractFullMappings(dataToMap);
            
            // 转换为最终需要的格式
            const finalMapping = {};
            for (const [key, value] of Object.entries(fullMappingsObj)) {
                finalMapping[key] = {
                    path: value.path,
                    desc: value.desc
                };
            }
            
            // 日志输出最终映射结果
            console.log('生成的最终映射结果:', finalMapping);
            
            // 格式化映射对象为UI显示所需字符串格式
            const formattedMappings = [];
            for (const [key, value] of Object.entries(fullMappingsObj)) {
                formattedMappings.push(`${key}: ${value.path} // ${value.desc}`);
            }
            
            // 将生成的映射显示在表单中
            elements.responseMapping.value = formattedMappings.join('\n');
            
            // 关闭响应预览模态框
            closeModal(elements.responsePreviewModal);
            
            showAlert('已生成完整响应映射', 'success');
        } catch (error) {
            console.error('生成完整响应映射失败:', error);
            showAlert('生成完整映射失败: ' + error.message, 'danger');
        }
    }

    // 提取完整映射（包括数组和对象）
    function extractFullMappings(data, prefix = '') {
        const mappings = {};
        
        function processFullMappings(obj, path = '') {
            if (obj === null || obj === undefined) return;
            
            if (typeof obj === 'object') {
                if (Array.isArray(obj)) {
                    // 对于数组，只添加@arr后缀映射，不再生成普通映射
                    const outputField = path.replaceAll('.', '_') + '@arr';
                    mappings[outputField] = {
                        path: path,
                        desc: getArrayDesc(path)
                    };
                    
                    // 如果数组不为空且第一个元素是对象，为其所有属性添加@arr_格式的映射
                    if (obj.length > 0 && typeof obj[0] === 'object' && obj[0] !== null) {
                        for (const [key, value] of Object.entries(obj[0])) {
                            const outputField = `${path.replaceAll('.', '_')}@arr_${key}`;
                            const propertyPath = `${path}.${key}`;
                            mappings[outputField] = {
                                path: propertyPath,
                                desc: getArrayItemDesc(path, key)
                            };
                        }
                    }
                } else {
                    // 为非数组对象生成普通映射
                    if (path) {
                        const outputField = path.replaceAll('.', '_');
                        mappings[outputField] = {
                            path: path,
                            desc: getDescriptionForField(path)
                        };
                    }
                    
                    // 处理对象的每个属性
                    for (const [key, value] of Object.entries(obj)) {
                        const newPath = path ? `${path}.${key}` : key;
                        
                        if (typeof value === 'object' && value !== null) {
                            // 递归处理嵌套对象或数组
                            processFullMappings(value, newPath);
                        } else {
                            // 简单类型值
                            const outputField = newPath.replaceAll('.', '_');
                            mappings[outputField] = {
                                path: newPath,
                                desc: getSimpleValueDesc(newPath, key, typeof value)
                            };
                        }
                    }
                }
            }
        }
        
        // 获取对象字段的描述
        function getDescriptionForField(path) {
            const pathParts = path.split('.');
            const lastPart = pathParts[pathParts.length - 1];
            
            // 使用全局状态中的默认描述
            return state.fieldDescriptions[lastPart] || lastPart;
        }
        
        // 获取数组字段的描述
        function getArrayDesc(path) {
            const pathParts = path.split('.');
            const lastPart = pathParts[pathParts.length - 1];
            
            // 检查数组特殊映射
            const arrayKey = `array_${lastPart}`;
            return state.fieldDescriptions[arrayKey] || state.fieldDescriptions[lastPart] || lastPart;
        }
        
        // 获取数组元素属性的描述
        function getArrayItemDesc(path, key) {
            const pathParts = path.split('.');
            const parentName = pathParts[pathParts.length - 1];
            
            // 检查组合键
            const combined = `${parentName}_${key}`;
            if (state.fieldDescriptions[combined]) {
                return state.fieldDescriptions[combined];
            }
            
            // 单独检查键名
            return state.fieldDescriptions[key] || key;
        }
        
        // 获取简单值的描述
        function getSimpleValueDesc(path, key, type) {
            return state.fieldDescriptions[key] || key;
        }
        
        processFullMappings(data, prefix);
        return mappings;
    }

    // 复制响应数据
    function copyResponseData() {
        const text = elements.responsePreview.textContent;
        
        if (text) {
            navigator.clipboard.writeText(text)
                .then(() => {
                    showAlert('响应数据已复制到剪贴板', 'success');
                })
                .catch(err => {
                    console.error('复制失败:', err);
                    showAlert('复制失败', 'danger');
                });
        }
    }

    // 显示加载中
    function showLoading(message = '加载中...') {
        elements.loadingMessage.textContent = message;
        elements.loadingElement.style.display = 'flex';
    }
    
    // 隐藏加载中
    function hideLoading() {
        elements.loadingElement.style.display = 'none';
    }
    
    // 显示警告消息
    function showAlert(message, type = 'info', duration = 3000) {
        const alertId = `alert-${Date.now()}`;
        const alertElement = document.createElement('div');
        alertElement.className = `alert alert-${type}`;
        alertElement.id = alertId;
        
        let icon = '✅'; // 默认图标
        
        switch (type) {
            case 'success':
                icon = '✅';
                break;
            case 'warning':
                icon = '⚠️';
                break;
            case 'danger':
                icon = '❌';
                break;
            case 'info':
                icon = 'ℹ️';
                break;
        }
        
        alertElement.innerHTML = `
            <span class="emoji-icon">${icon}</span>
            <p>${escapeHtml(message)}</p>
            <button class="alert-close" onclick="document.getElementById('${alertId}').remove()">&times;</button>
        `;
        
        document.getElementById('alert-container').appendChild(alertElement);
        
        // 自动关闭
        setTimeout(() => {
            const alert = document.getElementById(alertId);
            if (alert) {
                alert.style.opacity = '0';
                setTimeout(() => alert.remove(), 300); // 等待淡出动画完成后移除
            }
        }, duration);
    }
    
    // HTML转义
    function escapeHtml(str) {
        if (typeof str !== 'string') {
            return '';
        }
        
        return str
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;')
            .replace(/'/g, '&#039;');
    }

    


    // 更新表单中的响应映射示例文本
    function updateResponseMappingPlaceholder() {
        const placeholderText = `例如:
temperature: current.temp_c // 温度，摄氏度
condition_text: current.condition.text // 天气状况描述
sources@arr: refer.sources // 数据来源数组
location@arr_name: location.name // 数组location中每个对象的name属性
location@arr_id: location.id // 数组location中每个对象的ID属性`;
        
        if (elements.responseMapping) {
            elements.responseMapping.setAttribute('placeholder', placeholderText);
        }
    }
}); 