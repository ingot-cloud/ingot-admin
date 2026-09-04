FROM docker-registry.ingotcloud.top/nginx:1.28.3
VOLUME /tmp
ENV LANG en_US.UTF-8
ADD ./dist/ /usr/share/nginx/html/
COPY ./proxy.conf /etc/nginx/conf.d/
RUN nginx -t
EXPOSE 3000
