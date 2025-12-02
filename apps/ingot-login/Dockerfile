FROM docker-registry.ingotcloud.top/nginx:1.27.4
VOLUME /tmp
ENV LANG en_US.UTF-8
ADD ./dist/ /usr/share/nginx/html/
COPY ./proxy.conf /etc/nginx/conf.d/
EXPOSE 3000
EXPOSE 443